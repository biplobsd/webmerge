import axios from "axios";

export async function fetchHtml(url: string, signal?: AbortSignal, cookies?: string): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
  };

  if (cookies?.trim()) {
    headers["Cookie"] = cookies.trim();
  }

  const { data } = await axios.get<string>(url, {
    signal,
    headers,
    responseType: "text",
    timeout: 15000,
  });
  return data;
}
