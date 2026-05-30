/**
 * GLM (Zhipu / BigModel) chat client — powers the LLM investor profile.
 *
 * Uses the free `glm-4.7-flash` model. Operational facts baked into this client,
 * learned from the live API:
 *  - It is a *reasoning* model; we send `thinking.disabled` to skip reasoning tokens
 *    (otherwise the budget is consumed before any answer is produced).
 *  - The free tier is slow (observed 12–45s) and is sometimes throttled with the
 *    business error code `1305` ("model busy"). Callers MUST treat any failure as
 *    non-fatal and fall back to deterministic output.
 *  - The API key is read from the environment and is NEVER logged.
 */

const DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_MODEL = "glm-4.7-flash";

export interface GlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GlmOptions {
  /** Max completion tokens. Reasoning is disabled, so this all goes to the answer. */
  maxTokens?: number;
  temperature?: number;
  /** Total wall-clock budget across the initial attempt + one retry. */
  timeoutMs?: number;
  /** Request a JSON object response (response_format json_object). */
  json?: boolean;
}

/** True when a GLM key is present, so callers can decide to skip the LLM path. */
export function isGlmConfigured(): boolean {
  return Boolean(process.env.GLM_API_KEY);
}

interface GlmResponse {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  error?: { code?: string; message?: string };
}

export class GlmError extends Error {
  /** Whether a retry is worth attempting (fast-failing throttles / 5xx). */
  readonly retriable: boolean;
  constructor(message: string, retriable: boolean) {
    super(message);
    this.name = "GlmError";
    this.retriable = retriable;
  }
}

async function callOnce(
  messages: GlmMessage[],
  maxTokens: number,
  temperature: number,
  json: boolean,
  timeoutMs: number,
): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) throw new GlmError("GLM_API_KEY not configured", false);

  const baseUrl = process.env.GLM_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.GLM_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        thinking: { type: "disabled" },
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new GlmError(`GLM HTTP ${res.status}`, res.status === 429 || res.status >= 500);
    }

    const data = (await res.json()) as GlmResponse;
    if (data.error) {
      // 1301/1302/1303/1305 are rate / capacity errors → fast-failing & retriable.
      const transient = ["1301", "1302", "1303", "1305"].includes(data.error.code ?? "");
      throw new GlmError(`GLM error ${data.error.code ?? "?"}`, transient);
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new GlmError("GLM returned empty content", false);
    return content;
  } catch (err) {
    if (err instanceof GlmError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GlmError("GLM request timed out", false);
    }
    throw new GlmError(err instanceof Error ? err.message : "GLM request failed", true);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call GLM with a total time budget. Retries once on fast-failing transient errors
 * (e.g. code 1305), passing the *remaining* budget so total wall-clock stays bounded.
 * Throws GlmError on exhaustion — callers should fall back to deterministic output.
 */
export async function glmChat(messages: GlmMessage[], options: GlmOptions = {}): Promise<string> {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.4;
  const json = options.json ?? false;
  const totalBudget = options.timeoutMs ?? 50_000;

  const start = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = totalBudget - (Date.now() - start);
    if (remaining < 4_000) break; // not enough budget for a meaningful attempt
    try {
      return await callOnce(messages, maxTokens, temperature, json, remaining);
    } catch (err) {
      lastErr = err;
      if (err instanceof GlmError && err.retriable && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new GlmError("GLM unavailable", false);
}

/** Convenience: call GLM in JSON mode and parse the result. Throws on parse failure. */
export async function glmChatJson<T>(messages: GlmMessage[], options: GlmOptions = {}): Promise<T> {
  const raw = await glmChat(messages, { ...options, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Models occasionally wrap JSON in prose/fences despite json_object; salvage the object.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new GlmError("GLM returned unparseable JSON", false);
  }
}
