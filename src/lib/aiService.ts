import axios from "axios";
import { z } from "zod";
import { logger } from "./logger";
import type { ResultItem } from "./types";
import { DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL, DEFAULT_AI_TEMPERATURE } from "./constants";

const DEFAULT_BASE_URL = DEFAULT_AI_BASE_URL;
const DEFAULT_MODEL = DEFAULT_AI_MODEL;
const DEFAULT_TEMPERATURE = DEFAULT_AI_TEMPERATURE;

const BaseResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  published_at: z.string().nullable().optional(),
  publish_date: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  media_type: z.string().nullable().optional(),
  exact_title: z.string().nullable().optional(),
});

async function loadSettings(): Promise<{ baseUrl: string; apiKey: string; model: string }> {
  const s = await chrome.storage.sync.get(["aiBaseUrl", "aiApiKey", "aiModel"]);
  return {
    baseUrl: (s.aiBaseUrl as string) || DEFAULT_BASE_URL,
    apiKey: (s.aiApiKey as string) || "",
    model: (s.aiModel as string) || DEFAULT_MODEL,
  };
}

function parseArrayResponse(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["items", "results", "data", "products", "listings"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
    return [obj];
  }
  return [];
}

export class AIService {
  async extract(markdownContent: string, siteSchema: Record<string, string>): Promise<ResultItem[]> {
    const { baseUrl, apiKey, model } = await loadSettings();

    const schemaWithDates = {
      ...siteSchema,
      title: "string — the listing title",
      url: "string — direct link to the listing",
      published_at:
        "string (ISO 8601) or null — publish/post date. Convert relative dates " +
        'like "2 hours ago" to ISO 8601. Return null only if no date is found.',
      image_url: "string — direct link to the image",
      year: 'string (4-digit) or null — the release or publish year, e.g. "2026". Extract from the title or metadata if present.',
      media_type: "string or null — one of: movie, series, episode. Leave null if not applicable or unknown.",
      exact_title:
        'string or null — the clean title stripped of year, episode numbers, season info, and media type suffixes. Used for precise lookups (e.g. "Inception" not "Inception (2010)"). Leave null if same as title.',
    };

    const schemaStr = JSON.stringify(schemaWithDates, null, 2);

    const { data } = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        temperature: DEFAULT_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a data extraction engine. You extract structured data from web content " +
              "and return ONLY valid JSON. No explanation, no markdown, no code blocks.",
          },
          {
            role: "user",
            content:
              `Extract all product/listing items from the following content into a JSON array. ` +
              `Each item should match this schema:\n\n${schemaStr}\n\n` +
              `IMPORTANT EXTRACTION RULES:\n` +
              `1. For 'image_url': the content is Markdown, so images appear as ![alt text](url). ` +
              `Extract the URL inside the parentheses as the image_url. ` +
              `Each listing typically has one image near its title or price.\n` +
              `2. For 'published_at': include the publish/post date in ISO 8601 format ` +
              `(e.g. '2026-03-21T15:30:00'). Convert relative dates like "2 hours ago" to ISO 8601. ` +
              `Set to null only if no date information exists.\n` +
              `3. For 'url': extract the full href from Markdown links — they appear as [text](url).\n\n` +
              `Content:\n\n${markdownContent.slice(0, 20000)}\n\n` +
              `Return ONLY a valid JSON object with an "items" array. If no items found, return {"items": []}.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    try {
      const text: string = (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content.trim();

      const parsed = JSON.parse(text);
      const rawArray = parseArrayResponse(parsed);

      return z
        .array(BaseResultSchema.passthrough())
        .parse(rawArray)
        .map((item) => ({
          ...item,
          publish_date: item.published_at ?? item.publish_date ?? null,
        })) as ResultItem[];
    } catch (err) {
      logger.error({ err }, "AI extract: failed to parse response");
      throw new Error("AI returned invalid JSON");
    }
  }

  async suggestSchema(markdownContent: string): Promise<Record<string, string>> {
    const { baseUrl, apiKey, model } = await loadSettings();

    try {
      const { data } = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model,
          temperature: DEFAULT_TEMPERATURE,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a data schema analyst. Analyze web content and suggest a JSON Schema for the structured data found.",
            },
            {
              role: "user",
              content:
                `Analyze this search results page content. ` +
                `Suggest a JSON Schema object for the product/listing data. ` +
                `Include fields like title, price, image_url, product_url, rating, etc. ` +
                `as appropriate for the content.\n\n` +
                `Content:\n\n${markdownContent.slice(0, 5000)}\n\n` +
                `Return ONLY a valid JSON Schema object.`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const text: string = (data as { choices: Array<{ message: { content: string } }> }).choices[0].message.content.trim();

      return JSON.parse(text) as Record<string, string>;
    } catch (err) {
      logger.error({ err }, "AI suggestSchema: failed");
      return {
        title: "string",
        price: "string",
        url: "string",
        image_url: "string",
      };
    }
  }
}
