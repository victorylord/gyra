/**
 * app/lib/coding/codeindex.ts
 *
 * Lightweight, dependency-free symbol index for the Gyra workspace.
 * Reads the sandbox through ./sandbox only — no fs, no npm packages.
 */

import type { SandboxInput } from "./sandbox";
import {
  WORKSPACE_DIR,
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
  /** Workspace-relative path. */
  file: string;
  /** Absolute sandbox path. */
  path: string;
  /** 1-based line number. */
  line: number;
  /** 1-based column of the name. */
  column: number;
  signature: string;
  exported: boolean;
}

export interface IndexedFile {
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
  root: string;
  createdAt: number;
  updatedAt: number;
  files: IndexedFile[];
  symbols: CodeSymbol[];
  byName: Record<string, CodeSymbol[]>;
  fileCount: number;
  symbolCount: number;
}

export interface BuildIndexOptions {
  root?: string;
  maxFiles?: number;
  maxFileBytes?: number;
  force?: boolean;
}

export interface IndexSummary {
  files: number;
  symbols: number;
  root: string;
  createdAt: number;
  byKind: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

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

const IGNORED_FILE_SUFFIXES = [
  ".min.js",
  ".min.css",
  ".map",
  ".d.ts.map",
  ".lock",
  ".log",
  ".snap",
];

const MAX_FILES_DEFAULT = 2000;
const MAX_FILE_BYTES_DEFAULT = 512_000;
const CACHE_TTL_MS = 60_000;
const READ_CONCURRENCY = 8;

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

function sandboxKey(input: SandboxInput): string {
  if (!input) return "local";
  if (typeof input === "string") return input.trim() || "local";
  return input.sandboxId || "local";
}

function cacheKey(input: SandboxInput, root: string): string {
  return `${sandboxKey(input)}::${root}`;
}

export function invalidateIndex(input?: SandboxInput): void {
  const key = sandboxKey(input);
  for (const existing of Array.from(cache.keys())) {
    if (!input || existing.startsWith(`${key}::`)) cache.delete(existing);
  }
}

/* ------------------------------------------------------------------ */
/* Language detection                                                 */
/* ------------------------------------------------------------------ */

export function detectLanguage(filePath: string): string {
  const clean = filePath.split("?")[0].split("#")[0];
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
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "rb":
      return "ruby";
    case "java":
      return "java";
    case "kt":
      return "kotlin";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "hpp":
      return "cpp";
    case "cs":
      return "csharp";
    case "php":
      return "php";
    case "swift":
      return "swift";
    case "sql":
      return "sql";
    case "vue":
      return "vue";
    case "svelte":
      return "svelte";
    default:
      return ext;
  }
}

function isIndexableFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower === "package-lock.json" || lower === "yarn.lock") return false;
  for (const suffix of IGNORED_FILE_SUFFIXES) {
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
  line: string,
  lineNumber: number,
  file: string,
  absolutePath: string,
  exported: boolean,
): CodeSymbol {
  const column = line.indexOf(name);
  return {
    name,
    kind,
    file,
    path: absolutePath,
    line: lineNumber,
    column: column >= 0 ? column + 1 : 1,
    signature: line.trim().slice(0, 200),
    exported,
  };
}

export function extractSymbols(
  content: string,
  filePath: string = "",
): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  if (!content) return symbols;

  const absolutePath = filePath ? resolvePath(filePath) : "";
  const relative = filePath ? relativePath(absolutePath) : "";
  const file = relative || filePath;
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
    if (trimmed.startsWith("#!") && lineNumber === 1) continue;
    if (language === "python" && trimmed.startsWith("#")) continue;

    const exported = /^\s*export\b/.test(raw);
    const indent = raw.length - raw.trimStart().length;

    const add = (name: string, kind: SymbolKind) => {
      if (!name || CONTROL_WORDS.has(name)) return;
      const exists = symbols.some(
        (symbol) => symbol.name === name && symbol.line === lineNumber,
      );
      if (exists) return;
      symbols.push(
        makeSymbol(
          name,
          kind,
          raw,
          lineNumber,
          file,
          absolutePath,
          exported,
        ),
      );
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
      /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(
        raw,
      );
    if (classMatch) {
      add(classMatch[1], "class");
      continue;
    }

    const interfaceMatch =
      /^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (interfaceMatch) {
      add(interfaceMatch[1], "interface");
      continue;
    }

    const enumMatch =
      /^\s*(?:export\s+)?(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (enumMatch) {
      add(enumMatch[1], "enum");
      continue;
    }

    const typeMatch = /^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*[=<]/.exec(
      raw,
    );
    if (typeMatch) {
      add(typeMatch[1], "type");
      continue;
    }

    const functionMatch =
      /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(
        raw,
      );
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

    const constMatch =
      /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(raw);
    if (constMatch) {
      add(constMatch[1], "const");
      continue;
    }

    if (indent >= 2 && !trimmed.endsWith(";") && !trimmed.includes("=>")) {
      const methodMatch =
        /^\s{2,}(?:(?:public|private|protected|static|async|readonly|override|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?::[^{]+)?\{?\s*$/.exec(
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

  const patterns: RegExp[] = [
    /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /^\s*from\s+([\w.]+)\s+import\b/gm,
    /^\s*import\s+([\w.]+)\s*$/gm,
    /^\s*use\s+([\w:]+)/gm,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null = pattern.exec(content);
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
  named.lastIndex = 0;
  let match: RegExpExecArray | null = named.exec(content);
  while (match) {
    for (const piece of match[1].split(",")) {
      const name = piece.trim().split(/\s+as\s+/).pop();
      if (name) found.add(name.trim());
    }
    match = named.exec(content);
  }

  const declared =
    /export\s+(?:default\s+)?(?:abstract\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s*\*?\s*([A-Za-z_$][\w$]*)/g;
  declared.lastIndex = 0;
  match = declared.exec(content);
  while (match) {
    if (match[1]) found.add(match[1]);
    match = declared.exec(content);
  }

  return Array.from(found);
}

/* ------------------------------------------------------------------ */
/* Walking                                                            */
/* ------------------------------------------------------------------ */

interface WalkResult {
  paths: string[];
  truncated: boolean;
}

async function collectFiles(
  input: SandboxInput,
  root: string,
  maxFiles: number,
): Promise<WalkResult> {
  const queue: string[] = [root];
  const visited = new Set<string>();
  const paths: string[] = [];
  let truncated = false;

  while (queue.length > 0) {
    const directory = queue.shift();
    if (!directory || visited.has(directory)) continue;
    visited.add(directory);

    if (paths.length >= maxFiles) {
      truncated = true;
      break;
    }

    let entries: Awaited<ReturnType<typeof listDir>>;
    try {
      entries = await listDir(input, directory);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.type === "dir") {
        const name = entry.name;
        if (IGNORED_DIRECTORIES.has(name)) continue;
        if (name.startsWith(".") && name !== ".") continue;
        queue.push(entry.path || resolvePath(directory, name));
        continue;
      }

      if (!isIndexableFile(entry.name)) continue;
      paths.push(entry.path || resolvePath(directory, entry.name));
      if (paths.length >= maxFiles) {
        truncated = true;
        break;
      }
    }
  }

  return { paths, truncated };
}

async function indexFile(
  input: SandboxInput,
  path: string,
  maxBytes: number,
): Promise<IndexedFile | null> {
  let content: string;
  try {
    content = await readFileText(input, path);
  } catch {
    return null;
  }

  if (content.length > maxBytes) return null;

  const symbols = extractSymbols(content, path);
  const language = detectLanguage(path);

  return {
    path,
    relativePath: relativePath(path),
    language,
    lines: content ? content.split(/\r?\n/).length : 0,
    size: content.length,
    symbols,
    imports: extractImports(content),
    exports: extractExports(content),
  };
}

async function readAll(
  input: SandboxInput,
  paths: string[],
  maxBytes: number,
): Promise<IndexedFile[]> {
  const results: IndexedFile[] = [];

  for (let start = 0; start < paths.length; start += READ_CONCURRENCY) {
    const batch = paths.slice(start, start + READ_CONCURRENCY);
    const settled = await Promise.all(
      batch.map((path) => indexFile(input, path, maxBytes)),
    );
    for (const file of settled) {
      if (file) results.push(file);
    }
  }

  return results;
}

/* ------------------------------------------------------------------ */
/* Building                                                           */
/* ------------------------------------------------------------------ */

function normalizeBuildOptions(
  input?: string | BuildIndexOptions,
): Required<Omit<BuildIndexOptions, "force">> {
  if (typeof input === "string") {
    return {
      root: resolvePath(input),
      maxFiles: MAX_FILES_DEFAULT,
      maxFileBytes: MAX_FILE_BYTES_DEFAULT,
    };
  }
  return {
    root: resolvePath(input?.root ?? WORKSPACE_DIR),
    maxFiles:
      typeof input?.maxFiles === "number" && input.maxFiles > 0
        ? Math.min(input.maxFiles, MAX_FILES_DEFAULT * 2)
        : MAX_FILES_DEFAULT,
    maxFileBytes:
      typeof input?.maxFileBytes === "number" && input.maxFileBytes > 0
        ? input.maxFileBytes
        : MAX_FILE_BYTES_DEFAULT,
  };
}

function buildIndexObject(
  root: string,
  files: IndexedFile[],
): CodeIndex {
  const symbols: CodeSymbol[] = [];
  const byName: Record<string, CodeSymbol[]> = {};

  for (const file of files) {
    for (const symbol of file.symbols) {
      symbols.push(symbol);
      const bucket = byName[symbol.name];
      if (bucket) bucket.push(symbol);
      else byName[symbol.name] = [symbol];
    }
  }

  const now = Date.now();

  return {
    root,
    createdAt: now,
    updatedAt: now,
    files,
    symbols,
    byName,
    fileCount: files.length,
    symbolCount: symbols.length,
  };
}

export async function buildIndex(
  input: SandboxInput,
  options?: string | BuildIndexOptions,
): Promise<CodeIndex> {
  const normalized = normalizeBuildOptions(options);
  const force = typeof options === "object" && options !== null && options.force;

  const key = cacheKey(input, normalized.root);
  if (!force) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
      return cached;
    }
  }

  const { paths } = await collectFiles(input, normalized.root, normalized.maxFiles);
  const files = await readAll(input, paths, normalized.maxFileBytes);
  const index = buildIndexObject(normalized.root, files);

  cache.set(key, index);
  return index;
}

export async function getIndex(
  input: SandboxInput,
  options?: string | BuildIndexOptions,
): Promise<CodeIndex> {
  return buildIndex(input, options);
}

export async function refreshIndex(
  input: SandboxInput,
  options?: BuildIndexOptions,
): Promise<CodeIndex> {
  return buildIndex(input, { ...(options ?? {}), force: true });
}

export const indexProject = buildIndex;
export const getCodeIndex = getIndex;

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

export function findSymbol(index: CodeIndex, name: string): CodeSymbol[];
export function findSymbol(name: string, index: CodeIndex): CodeSymbol[];
export function findSymbol(
  a: CodeIndex | string,
  b: CodeIndex | string,
): CodeSymbol[] {
  const index = typeof a === "string" ? (b as CodeIndex) : a;
  const name = typeof a === "string" ? a : (b as string);

  if (!index || typeof name !== "string" || !name) return [];

  const exact = index.byName?.[name];
  if (exact && exact.length > 0) return exact;

  const lower = name.toLowerCase();
  return index.symbols.filter((symbol) => symbol.name.toLowerCase() === lower);
}

export function searchSymbols(
  index: CodeIndex,
  query: string,
  limit: number = 25,
): CodeSymbol[] {
  if (!index || !Array.isArray(index.symbols)) return [];
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

export function listFiles(index: CodeIndex, limit: number = 500): IndexedFile[] {
  if (!index || !Array.isArray(index.files)) return [];
  return index.files.slice(0, limit);
}

export function summarizeIndex(index: CodeIndex): IndexSummary {
  const byKind: Record<string, number> = {};
  const symbols = index?.symbols ?? [];

  for (const symbol of symbols) {
    byKind[symbol.kind] = (byKind[symbol.kind] ?? 0) + 1;
  }

  return {
    files: index?.fileCount ?? 0,
    symbols: index?.symbolCount ?? symbols.length,
    root: index?.root ?? WORKSPACE_DIR,
    createdAt: index?.createdAt ?? 0,
    byKind,
  };
}