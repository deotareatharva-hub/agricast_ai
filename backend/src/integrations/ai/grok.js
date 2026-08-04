import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// Thin client around the Grok API (xAI's OpenAI-compatible chat completions
// endpoint). This is the ONLY file in the codebase that holds the Grok API
// key or knows Grok's request/response wire shape - same isolation rule as
// integrations/satellite/sentinel.js and integrations/weather/openMeteo.js.
// Nothing outside this file should ever see GROK_API_KEY; ai.service.js
// only ever gets back a plain string (the assistant's raw message content).

const REQUEST_TIMEOUT_MS = env.ai.grok.timeoutMs;
const MAX_RETRIES = env.ai.grok.maxRetries;
const RETRY_DELAY_MS = env.ai.grok.retryDelayMs;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only on transient failures: network errors, timeouts, 429 (rate
// limit), and 5xx responses - same convention as sentinel.js's
// isTransientError. A non-429 4xx (bad request, invalid model name) is a
// caller bug, not a transient condition, so it fails fast instead of
// retrying.
function isTransientError(error) {
  if (error.code === "ECONNABORTED") return true; // axios timeout
  if (!error.response) return true; // network-level failure, DNS, etc.
  if (error.response.status === 429) return true;
  return error.response.status >= 500;
}

async function requestWithRetry(requestFn, attempt = 0) {
  try {
    return await requestFn();
  } catch (error) {
    const canRetry = attempt < MAX_RETRIES && isTransientError(error);

    logger.warn("Grok API request failed", {
      attempt,
      willRetry: canRetry,
      status: error.response?.status,
      message: error.message,
    });

    if (!canRetry) {
      throw error;
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1)); // simple linear backoff
    return requestWithRetry(requestFn, attempt + 1);
  }
}

export const grokClient = {
  // Sends a chat-completions request built from separate system/developer/
  // user prompts (see promptBuilder.js) and returns the raw assistant
  // message content as a string. Callers (ai.service.js, via
  // responseParser.js) are responsible for parsing/validating that string
  // as JSON - this client only knows how to talk to Grok, not what the
  // response is supposed to contain.
  generateCompletion: async ({ systemPrompt, developerPrompt, userPrompt }) => {
    if (!env.ai.grok.apiKey) {
      // Mirrors satellite's "boot fine, fail clearly when actually used
      // without credentials" convention (see tokenManager.js) rather than
      // crashing the whole server at startup over an optional module.
      throw ApiError.internal(
        "AI recommendations are temporarily unavailable (missing Grok API configuration)."
      );
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: developerPrompt },
      { role: "user", content: userPrompt },
    ];

    const requestBody = {
      model: env.ai.grok.model,
      messages,
      temperature: 0.3, // low temperature - this is a decision-support tool, not creative writing
      response_format: { type: "json_object" },
    };

    let response;
    try {
      response = await requestWithRetry(() =>
        axios.post(env.ai.grok.apiUrl, requestBody, {
          headers: {
            Authorization: `Bearer ${env.ai.grok.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: REQUEST_TIMEOUT_MS,
        })
      );
    } catch (error) {
      logger.error("Grok API call failed after retries", {
        status: error.response?.status,
        message: error.message,
      });
      throw ApiError.internal(
        "The AI recommendation service is temporarily unavailable. Please try again shortly."
      );
    }

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw ApiError.internal("The AI recommendation service returned an empty response.");
    }

    return content;
  },
};
