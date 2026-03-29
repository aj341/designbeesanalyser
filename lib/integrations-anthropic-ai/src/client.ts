import Anthropic from "@anthropic-ai/sdk";

const apiKey =
  process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ??
  process.env.ANTHROPIC_API_KEY;
const baseURL =
  process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ??
  process.env.ANTHROPIC_BASE_URL;

if (!apiKey) {
  throw new Error(
    "Set ANTHROPIC_API_KEY (or AI_INTEGRATIONS_ANTHROPIC_API_KEY) before starting the app.",
  );
}

export const anthropic = new Anthropic({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
