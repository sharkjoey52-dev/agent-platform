// Your Composio auth configs, keyed by app slug.
// These IDs are not secrets.
export const AUTH_CONFIGS: Record<string, string> = {
  gmail: "ac_WNObj696UKuf",
  googlecalendar: "ac_tebD3i-qilnc",
  googledrive: "ac_OHV9KH1qhO6A",
  googlesheets: "ac_u9ohF9YlUW0i",
  googletasks: "ac_ipxNioV4Y3Wv",
  figma: "ac_j_9KtOe4AcqL",
  whatsapp: "ac_RY5J4hePqpsC",
};

// The apps shown on the Connectors page
export const CATALOG: string[] = [
  "gmail",
  "googlecalendar",
  "googledrive",
  "googlesheets",
  "googletasks",
  "googledocs",
  "figma",
  "whatsapp",
  "github",
  "notion",
  "slack",
  "outlook",
  "supabase",
  "linear",
  "jira",
  "airtable",
  "hubspot",
  "perplexityai",
  "serpapi",
  "firecrawl",
  "tavily",
];

// Only pass auth configs for apps that are in the session
export function authConfigsFor(slugs: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const slug of slugs) {
    if (AUTH_CONFIGS[slug]) result[slug] = AUTH_CONFIGS[slug];
  }
  return result;
}
