import { z } from "zod";
import { DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from "./constants";

export const SiteConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  faviconUrl: z.string(),
  searchUrlTemplate: z.string().refine((t) => t.includes("{query}"), {
    message: "Template must contain {query}",
  }),
  listingUrl: z.string().url(),
  cookies: z.string().default(""),
  isHomepage: z.boolean().default(false),
  enabled: z.boolean().default(true),
  schema: z.record(z.string(), z.string()).default({}),
  schemaTypes: z.record(z.string(), z.string()).optional().default({}),
});

export const SiteGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  siteIds: z.array(z.string()).default([]),
});

export const SettingsSchema = z.object({
  aiBaseUrl: z.string().default(DEFAULT_AI_BASE_URL),
  aiApiKey: z.string().default(""),
  aiModel: z.string().default(DEFAULT_AI_MODEL),
  sites: z.array(SiteConfigSchema).default([]),
  theme: z.enum(["light", "dark"]).default("dark"),
  alwaysShowLatest: z.boolean().default(false),
  groups: z.array(SiteGroupSchema).default([]),
});
