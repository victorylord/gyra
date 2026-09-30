export type Prompt = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tags?: string[];
};

export type PromptCategory = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  prompts: Prompt[];
};

export const PROMPT_LIBRARY: PromptCategory[] = [
  {
    id: "writing",
    title: "Writing",
    emoji: "✍️",
    description: "Emails, essays, articles, editing.",
    prompts: [
      {
        id: "cold-email",
        title: "Write a cold email",
        description: "A short, respectful outreach email that gets replies.",
        prompt:
          "Write a short cold email to [person/company] about [topic]. Keep it under 120 words, warm but professional, with one clear ask. Include a subject line.",
      },
      {
        id: "rewrite-formal",
        title: "Rewrite formally",
        description: "Turn casual text into professional writing.",
        prompt:
          "Rewrite the following text in a formal, professional tone. Keep the meaning identical:\n\n[PASTE TEXT]",
      },
      {
        id: "blog-post",
        title: "Blog post outline",
        description: "A clean structure with headings and subpoints.",
        prompt:
          "Create a detailed blog post outline on the topic: [TOPIC]. Include a hook intro, 4-6 sections with subpoints, and a conclusion with a call to action.",
      },
      {
        id: "summarize",
        title: "Summarize in 5 bullets",
        description: "Condense any text to its essence.",
        prompt:
          "Summarize the following text in exactly 5 bullet points. Each bullet must be one short sentence:\n\n[PASTE TEXT]",
      },
    ],
  },
  {
    id: "coding",
    title: "Coding",
    emoji: "💻",
    description: "Debug, explain, review, or write code.",
    prompts: [
      {
        id: "debug",
        title: "Debug this code",
        description: "Find the bug and explain the fix.",
        prompt:
          "The following code has a bug. Find it, explain what's wrong, and give me the corrected version:\n\n```\n[PASTE CODE]\n```\n\nError: [PASTE ERROR]",
      },
      {
        id: "explain-code",
        title: "Explain this code",
        description: "Line-by-line explanation of what code does.",
        prompt:
          "Explain what this code does, line by line, in plain English. Then summarize its purpose in one sentence:\n\n```\n[PASTE CODE]\n```",
      },
      {
        id: "review-pr",
        title: "Code review",
        description: "A senior dev style review of your code.",
        prompt:
          "Review the following code as a senior engineer. Point out bugs, security issues, performance problems, and style issues. Suggest improvements with code snippets:\n\n```\n[PASTE CODE]\n```",
      },
      {
        id: "regex",
        title: "Write a regex",
        description: "Explain and give a working regex.",
        prompt:
          "Write a regular expression that matches [DESCRIBE PATTERN]. Explain each part, and give me an example of it matching and not matching.",
      },
    ],
  },
  {
    id: "business",
    title: "Business",
    emoji: "💼",
    description: "Strategy, pitches, plans, analysis.",
    prompts: [
      {
        id: "swot",
        title: "SWOT analysis",
        description: "Strengths, weaknesses, opportunities, threats.",
        prompt:
          "Do a SWOT analysis for [COMPANY/PRODUCT/IDEA]. Be specific and honest — include at least 4 points per quadrant.",
      },
      {
        id: "pitch",
        title: "Elevator pitch",
        description: "A 30-second pitch that lands.",
        prompt:
          "Write a 30-second elevator pitch for [PRODUCT]. Include the problem, the solution, the target user, and a hook. Keep it under 90 words.",
      },
      {
        id: "pricing",
        title: "Pricing strategy",
        description: "Suggest a tiered pricing model.",
        prompt:
          "Suggest a 3-tier pricing strategy for [PRODUCT]. For each tier, give a name, price, target customer, and 4-5 features. Explain the reasoning behind the numbers.",
      },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    emoji: "🎓",
    description: "Learn, study, and understand anything.",
    prompts: [
      {
        id: "eli5",
        title: "Explain like I'm 5",
        description: "Simple explanation of a complex topic.",
        prompt:
          "Explain [TOPIC] like I'm 5 years old. Use simple words, a fun analogy, and one real-world example.",
      },
      {
        id: "study-plan",
        title: "Study plan",
        description: "A structured plan to learn something.",
        prompt:
          "Create a 30-day study plan to learn [SKILL/TOPIC] as a beginner. Include daily topics, resources, and one small project per week.",
      },
      {
        id: "quiz-me",
        title: "Quiz me",
        description: "Test your knowledge on any topic.",
        prompt:
          "Quiz me on [TOPIC]. Ask me 5 multiple-choice questions one at a time. After I answer each, tell me if I'm right and explain briefly.",
      },
    ],
  },
  {
    id: "creative",
    title: "Creative",
    emoji: "🎨",
    description: "Stories, names, ideas, brainstorming.",
    prompts: [
      {
        id: "story",
        title: "Short story",
        description: "A 300-word story from any premise.",
        prompt:
          "Write a 300-word short story based on this premise: [PREMISE]. Give it a clear beginning, a twist, and an ending that lingers.",
      },
      {
        id: "names",
        title: "Brand name ideas",
        description: "Ten name ideas for anything.",
        prompt:
          "Give me 10 brand name ideas for [PRODUCT/IDEA]. For each, add a one-line tagline and explain the vibe. Mix modern, classic, and playful.",
      },
      {
        id: "brainstorm",
        title: "Brainstorm 20 ideas",
        description: "Twenty fast ideas, no filtering.",
        prompt:
          "Brainstorm 20 ideas for [GOAL/PROBLEM]. Don't filter — quantity over quality. Number them 1-20.",
      },
    ],
  },
  {
    id: "research",
    title: "Research",
    emoji: "🔎",
    description: "Compare, analyze, and decide.",
    prompts: [
      {
        id: "compare",
        title: "Compare two options",
        description: "A structured comparison with a recommendation.",
        prompt:
          "Compare [A] and [B] for [USE CASE]. Give a table with pros, cons, cost, and best-fit scenario. End with a clear recommendation.",
      },
      {
        id: "pros-cons",
        title: "Pros and cons",
        description: "Balanced pros and cons on any decision.",
        prompt:
          "Give me a balanced list of pros and cons for [DECISION/IDEA]. Be honest — include at least 5 on each side.",
      },
      {
        id: "deep-dive",
        title: "Deep dive",
        description: "An expert-level breakdown of a topic.",
        prompt:
          "Give me a deep dive on [TOPIC]. Cover: what it is, why it matters, key players, common misconceptions, and what an expert would want to know.",
      },
    ],
  },
];