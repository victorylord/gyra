/**
 * app/lib/coding/codeindex.ts
 *
 * Dependency-free code index for the Gyra workspace.
 * Reads through ./sandbox only — no fs, no extra packages.
 */

import type { SandboxInput, Sandbox } from "./sandbox";
import {
  WORKSPACE_DIR,
  ensureSandbox,
  listDir,
  readFileText,
  relativePath,
  resolvePath,
} from "./sandbox";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type SymbolKind =
  | "class"
  | "function"
  | "method"
  | "interface"
  | "type"
  | "enum"
  | "const"
  | "variable"
  | "module";

export interface CodeSymbol {
  name: string;
  kind: SymbolKind;
  /** Workspace-relative file path. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** 1-based column of the name. */
  column: number;
  signature: string;
  exported: boolean;
}

export interface CodeFile {
  path: string;
  relativePath: string;
  language: string;
  lines: number;
  size: number;
  symbols: CodeSymbol[];
  imports: string[];
  exports: string[];
}

export interface CodeIndex {
  sandboxId: string;
  root: string;
  files: CodeFile[];
  symbols: CodeSymbol[];
  byName: Record<string, CodeSymbol[]>;
  fileCount: number;
  symbolCount: number;
  /** ISO timestamp. */
  builtAt: string;
}

export interface BuildIndexOptions {
  root?: string;
  maxFiles?: number;
  force?: boolean;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 60_000;
const MAX_FILES_DEFAULT = 2000;
const MAX_FILE_BYTES = 512_000;
const READ_CONCURRENCY = 8;

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "tmp",
  "temp",
  ".idea",
  ".vscode",
]);

const INDEXED_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "mts",
  "cts",
  "py",
  "go",
  "rs",
  "rb",
  "java",
  "kt",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "php",
  "swift",
  "sql",
  "vue",
  "svelte",
]);

const IGNORED_SUFFIXES = [".min.js", ".map", ".d.ts.map", ".lock", ".log", ".snap"];

const CONTROL_WORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "do",
  "else",
  "try",
  "finally",
  "return",
  "await",
  "new",
  "typeof",
  "delete",
  "in",
  "of",
  "with",
  "function",
]);

/* ------------------------------------------------------------------ */
/* Cache                                                              */
/* ------------------------------------------------------------------ */

const cache = new Map<string, CodeIndex>();

export function invalidateIndex(sandboxId?: string): void {
  if (sandboxId) cache.delete(sandboxId);
  else cache.clear();
}

/* ------------------------------------------------------------------ */
/* Language helpers                                                   */
/* ------------------------------------------------------------------ */

export function detectLanguage(filePath: string): string {
  const clean = (filePath || "").split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return "text";
  const ext = clean.slice(dot + 1).toLowerCase();

  switch (ext) {
    case "ts":
    case "mts":
    case "cts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "jsx":
      return "jsx";
    case "py":
      return "python";
    default:
      return ext;
  }
}

function isIndexableFile(name: string): boolean {
  const lower = (name || "").toLowerCase();
  if (lower === "package-lock.json" || lower === "yarn.lock") return false;
  for (const suffix of IGNORED_SUFFIXES) {
    if (lower.endsWith(suffix)) return false;
  }
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return false;
  return INDEXED_EXTENSIONS.has(lower.slice(dot + 1));
}

/* ------------------------------------------------------------------ */
/* Symbol extraction                                                  */
/* ------------------------------------------------------------------ */

function makeSymbol(
  name: string,
  kind: SymbolKind,
  raw: string,
  lineNumber: number,
  file: string,
  exported: boolean,
): CodeSymbol {
  const column = raw.indexOf(name);
  return {
    name,
    kind,
    file,
    line: lineNumber,
    column: column >= 0 ? column + 1 : 1,
    signature: raw.trim().slice(0, 200),
    exported,
  };
}

export function extractSymbols(content: string, filePath: string = ""): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  if (!content) return symbols;

  const file = filePath ? relativePath(resolvePath(filePath)) || filePath : "";
  const language = detectLanguage(filePath);
  const lines = content.split(/\r?\n/);

  let inBlockComment = false;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();
    const lineNumber = index + 1;

    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;
      continue;
    }
    if (!trimmed) continue;
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
    if (trimmed.startsWith("#!")) continue;
    if (language === "python" && trimmed.startsWith("#")) continue;

    const exported = /^\s*export\b/.test(raw);
    const indent = raw.length - raw.trimStart().length;

    const add = (name: string, kind: SymbolKind) => {
      if (!name || CONTROL_WORDS.has(name)) return;
      const duplicate = symbols.some(
        (symbol) => symbol.name === name && symbol.line === lineNumber,
      );
      if (duplicate) return;
      symbols.push(makeSymbol(name, kind, raw, lineNumber, file, exported));
    };

    if (language === "python") {
      const def = /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/.exec(raw);
      if (def) {
        add(def[1], indent === 0 ? "function" : "method");
        continue;
      }
      const cls = /^\s*class\s+([A-Za-z_]\w*)/.exec(raw);
      if (cls) {
        add(cls[1], "class");
        continue;
      }
      continue;
    }

    if (language === "go") {
      const fn = /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/.exec(raw);
      if (fn) {
        add(fn[1], "function");
        continue;
      }
      const goType = /^\s*type\s+([A-Za-z_]\w*)/.exec(raw);
      if (goType) {
        add(goType[1], "type");
        continue;
      }
      continue;
    }

    const classMatch =
      /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (classMatch) {
      add(classMatch[1], "class");
      continue;
    }

    const interfaceMatch = /^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (interfaceMatch) {
      add(interfaceMatch[1], "interface");
      continue;
    }

    const enumMatch = /^\s*(?:export\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (enumMatch) {
      add(enumMatch[1], "enum");
      continue;
    }

    const typeMatch = /^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*[=<]/.exec(raw);
    if (typeMatch) {
      add(typeMatch[1], "type");
      continue;
    }

    const functionMatch =
      /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(raw);
    if (functionMatch) {
      add(functionMatch[1], "function");
      continue;
    }

    const arrowMatch =
      /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.exec(
        raw,
      );
    if (arrowMatch) {
      add(arrowMatch[1], "function");
      continue;
    }

    const constMatch = /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (constMatch) {
      add(constMatch[1], "const");
      continue;
    }

    if (indent >= 2 && !trimmed.endsWith(";") && !trimmed.includes("=>")) {
      const methodMatch =
        /^\s{2,}(?:(?:public|private|protected|static|async|readonly|override|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{]+)?\{?\s*$/.exec(
          raw,
        );
      if (methodMatch) {
        add(methodMatch[1], "method");
        continue;
      }
    }
  }

  return symbols;
}

export function extractImports(content: string): string[] {
  const found = new Set<string>();
  if (!content) return [];

  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /^\s*from\s+([\w.]+)\s+import\b/gm,
    /^\s*import\s+([\w.]+)\s*$/gm,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match = pattern.exec(content);
    while (match) {
      if (match[1]) found.add(match[1]);
      match = pattern.exec(content);
    }
  }

  return Array.from(found);
}

export function extractExports(content: string): string[] {
  const found = new Set<string>();
  if (!content) return [];

  const named = /export\s+(?:type\s+)?\{([^}]*)\}/g;
  let match = named.exec(content);
  while (match) {
    for (const piece of match[1].split(",")) {
      const name = piece.trim().split(/\s+as\s+/).pop();
      if (name) found.add(name.trim());
    }
    match = named.exec(content);
  }

  const declared =
    /export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s*\*?\s*([A-Za-z_$][\w$]*)/g;
  match = declared.exec(content);
  while (match) {
    if (match[1]) found.add(match[1]);
    match = declared.exec(content);
  }

  return Array.from(found);
}

/* ------------------------------------------------------------------ */
/* Walking + reading                                                  */
/* ------------------------------------------------------------------ */

function joinPath(directory: string, name: string): string {
  if (!name) return directory || "/";
  if (name.startsWith("/")) return name;
  const base = directory.endsWith("/") ? directory.slice(0, -1) : directory;
  return `${base || ""}/${name}`;
}

async function walkProject(
  sandbox: Sandbox,
  root: string,
  maxFiles: number,
): Promise<string[]> {
  const queue: string[] = [root];
  const visited = new Set<string>();
  const paths: string[] = [];

  while (queue.length > 0 && paths.length < maxFiles) {
    const directory = queue.shift();
    if (!directory || visited.has(directory)) continue;
    visited.add(directory);

    let entries: Awaited<ReturnType<typeof listDir>>;
    try {
      entries = await listDir(sandbox, directory);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.type === "dir") {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        if (entry.name.startsWith(".")) continue;
        queue.push(entry.path || joinPath(directory, entry.name));
        continue;
      }

      if (!isIndexableFile(entry.name)) continue;
      paths.push(entry.path || joinPath(directory, entry.name));
      if (paths.length >= maxFiles) break;
    }
  }

  return paths;
}

async function readOneFile(
  sandbox: Sandbox,
  path: string,
): Promise<CodeFile | null> {
  let content: string;
  try {
    content = await readFileText(sandbox, path);
  } catch {
    return null;
  }

  if (content.length > MAX_FILE_BYTES) return null;

  return {
    path,
    relativePath: relativePath(path),
    language: detectLanguage(path),
    lines: content ? content.split(/\r?\n/).length : 0,
    size: content.length,
    symbols: extractSymbols(content, path),
    imports: extractImports(content),
    exports: extractExports(content),
  };
}

async function readMany(sandbox: Sandbox, paths: string[]): Promise<CodeFile[]> {
  const files: CodeFile[] = [];

  for (let start = 0; start < paths.length; start += READ_CONCURRENCY) {
    const batch = paths.slice(start, start + READ_CONCURRENCY);
    const settled = await Promise.all(batch.map((path) => readOneFile(sandbox, path)));
    for (const file of settled) {
      if (file) files.push(file);
    }
  }

  return files;
}

function buildByName(symbols: CodeSymbol[]): Record<string, CodeSymbol[]> {
  const byName: Record<string, CodeSymbol[]> = {};
  for (const symbol of symbols) {
    const bucket = byName[symbol.name];
    if (bucket) bucket.push(symbol);
    else byName[symbol.name] = [symbol];
  }
  return byName;
}

/* ------------------------------------------------------------------ */
/* Build                                                              */
/* ------------------------------------------------------------------ */

export async function buildIndex(
  target?: SandboxInput,
  options: BuildIndexOptions = {},
): Promise<CodeIndex> {
  const sandbox = await ensureSandbox(target);
  const sandboxId = sandbox.sandboxId;
  const root = resolvePath(options.root ?? WORKSPACE_DIR);
  const maxFiles =
    typeof options.maxFiles === "number" && options.maxFiles > 0
      ? Math.min(options.maxFiles, MAX_FILES_DEFAULT * 2)
      : MAX_FILES_DEFAULT;

  if (!options.force) {
    const cached = cache.get(sandboxId);
    if (
      cached &&
      cached.root === root &&
      Date.now() - Date.parse(cached.builtAt) < CACHE_TTL_MS
    ) {
      return cached;
    }
  }

  const paths = await walkProject(sandbox, root, maxFiles);
  const files = await readMany(sandbox, paths);

  const symbols: CodeSymbol[] = [];
  for (const file of files) {
    for (const symbol of file.symbols) symbols.push(symbol);
  }

  const index: CodeIndex = {
    sandboxId: sandbox.sandboxId,
    root,
    files,
    symbols,
    byName: buildByName(symbols),
    fileCount: files.length,
    symbolCount: symbols.length,
    builtAt: new Date().toISOString(),
  };

  cache.set(sandbox.sandboxId, index);
  return index;
}

export const getIndex = buildIndex;
export const indexProject = buildIndex;

export async function refreshIndex(
  target?: SandboxInput,
  options: BuildIndexOptions = {},
): Promise<CodeIndex> {
  return buildIndex(target, { ...options, force: true });
}

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

export async function findSymbol(
  name: string,
  target?: SandboxInput,
): Promise<CodeSymbol[]> {
  const needle = (name ?? "").trim();
  if (!needle) return [];

  const index = await buildIndex(target);

  const exact = index.byName[needle];
  if (exact && exact.length > 0) return exact;

  const lower = needle.toLowerCase();
  return index.symbols.filter((symbol) => symbol.name.toLowerCase() === lower);
}

export async function searchSymbols(
  query: string,
  target?: SandboxInput,
  limit: number = 25,
): Promise<CodeSymbol[]> {
  const index = await buildIndex(target);
  const needle = (query ?? "").trim().toLowerCase();
  if (!needle) return index.symbols.slice(0, limit);

  const scored: { symbol: CodeSymbol; score: number }[] = [];

  for (const symbol of index.symbols) {
    const name = symbol.name.toLowerCase();
    let score = 0;

    if (name === needle) score = 100;
    else if (name.startsWith(needle)) score = 70;
    else if (name.includes(needle)) score = 40;
    else if (symbol.file.toLowerCase().includes(needle)) score = 15;
    else continue;

    if (symbol.exported) score += 5;
    score -= Math.min(name.length, 40) / 100;

    scored.push({ symbol, score });
  }

  scored.sort((left, right) => right.score - left.score);
  return scored.slice(0, limit).map((entry) => entry.symbol);
}