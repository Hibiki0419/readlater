import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

type FetchResult = {
  title: string | null;
  domain: string | null;
  content: string | null;
  excerpt: string | null;
};

export async function fetchArticleData(url: string): Promise<FetchResult> {
  let domain: string | null = null;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return { title: null, domain: null, content: null, excerpt: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReadLater/1.0)",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return {
      title: article?.title || dom.window.document.title || null,
      domain,
      content: article?.content || null,
      excerpt: article?.excerpt || null,
    };
  } catch {
    return { title: null, domain, content: null, excerpt: null };
  }
}

// Keep backward compat alias used nowhere but just in case
export const fetchTitleFromUrl = async (url: string) => {
  const { title, domain } = await fetchArticleData(url);
  return { title, domain };
};
