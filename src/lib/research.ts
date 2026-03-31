import { PrismaClient } from "@prisma/client";
import { JSDOM } from "jsdom";
import { fetchArticleData } from "./fetch-title";
import { fetchPopularity } from "./popularity";

type RssItem = { title: string; link: string; source?: string };

async function fetchRss(url: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadLater/1.0)" } });
    clearTimeout(timeout);
    const xml = await res.text();
    const dom = new JSDOM(xml, { contentType: "text/xml" });
    const doc = dom.window.document;
    const items: RssItem[] = [];
    doc.querySelectorAll("item").forEach((item) => {
      const title = item.querySelector("title")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const source = item.querySelector("source")?.textContent || "";
      if (link) items.push({ title, link: link.trim(), source });
    });
    return items;
  } catch { return []; }
}

async function resolveRedirect(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadLater/1.0)" } });
    clearTimeout(timeout);
    return res.url || url;
  } catch { return url; }
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export async function doResearch(prisma: PrismaClient, userId: number, query: string) {
  // Search Google News
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
  const items = await fetchRss(url);
  const top = items.slice(0, 15);

  if (top.length === 0) {
    const content = "<p>関連するニュースが見つかりませんでした。</p>";
    const research = await prisma.research.create({ data: { query, content, userId } });
    return research;
  }

  // Resolve redirect URLs and add articles to the user's list
  const resolvedItems: { title: string; link: string; resolvedUrl: string; source: string }[] = [];
  for (const item of top) {
    const resolvedUrl = item.link.includes("news.google.com")
      ? await resolveRedirect(item.link)
      : item.link;
    resolvedItems.push({ ...item, resolvedUrl, source: item.source || "" });

    // Add to articles if not exists
    const exists = await prisma.article.findFirst({ where: { url: resolvedUrl, userId } });
    if (!exists) {
      try {
        const [articleData, popularity] = await Promise.all([
          fetchArticleData(resolvedUrl),
          fetchPopularity(resolvedUrl),
        ]);
        // Auto-tag with query
        let tag = await prisma.tag.findFirst({ where: { name: query, userId } });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: query, color: "#08d9d6", userId } });
        }
        await prisma.article.create({
          data: {
            url: resolvedUrl,
            title: articleData.title || item.title || null,
            domain: articleData.domain,
            content: articleData.content,
            excerpt: articleData.excerpt,
            popularity,
            userId,
            tags: { create: [{ tagId: tag.id }] },
          },
        });
      } catch (e) {
        console.error(`[research] Failed to add article: ${resolvedUrl}`, e);
      }
    }
  }

  // Build prompt with sources
  const articleList = resolvedItems.map((item, i) => {
    const src = item.source ? ` (${item.source})` : "";
    return `${i+1}. ${item.title}${src}\n   URL: ${item.resolvedUrl}`;
  }).join("\n");

  const prompt = `ユーザーが以下の情報を求めています：

「${query}」

以下は関連する最新ニュース記事です：

${articleList}

上記の情報源をもとに、ユーザーの質問に対する包括的なリサーチレポートをHTML形式で作成してください：
- <div>で囲んでください
- <h2>で主要トピック、<p>で本文、<ul><li>で箇条書き
- 重要なポイントを<strong>で強調
- 各情報の出典を記事タイトルで明記し、リンク付きで引用してください（<a href="URL" target="_blank">タイトル</a>）
- 日本語で簡潔かつ正確に
- 最後に「参考文献」セクションを<h2>で作り、使用した全記事をリスト化してください（<ol><li><a href="URL" target="_blank">タイトル</a> - ソース名</li></ol>）
- 信頼できる情報のみを含め、推測は明記してください`;

  const content = await callClaude(prompt);
  const research = await prisma.research.create({ data: { query, content, userId } });
  console.log(`[research] Generated research id=${research.id}, added ${resolvedItems.length} articles`);
  return research;
}
