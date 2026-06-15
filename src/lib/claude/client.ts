import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export function getClaudeClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}
