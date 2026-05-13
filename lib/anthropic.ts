import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODELS = {
  // Chat: balanced cost/quality for conversational replies
  chat: "claude-sonnet-4-6",
  // Agents: top quality for memos, briefs, peer benchmarks
  agent: "claude-opus-4-7",
} as const;