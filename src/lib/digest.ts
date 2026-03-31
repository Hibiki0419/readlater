import { PrismaClient } from "@prisma/client";
import { JSDOM } from "jsdom";

type RssItem = { title: string; link: string; source?: string; pubDate?: string };

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
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      if (link) items.push({ title, link: link.trim(), source, pubDate });
    });
    return items;
  } catch { return []; }
}

function isToday(pubDate: string | undefined): boolean {
  if (!pubDate) return true; // include if no date
  try {
    const pub = new Date(pubDate);
    const now = new Date();
    // Same day in JST (UTC+9)
    const pubJST = new Date(pub.getTime() + 9 * 60 * 60 * 1000);
    const nowJST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return pubJST.toISOString().slice(0, 10) === nowJST.toISOString().slice(0, 10);
  } catch { return true; }
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2048, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export async function generateDigest(prisma: PrismaClient, userId: number): Promise<{ id: number } | null> {
  const keywords = await prisma.keyword.findMany({ where: { userId } });
  if (keywords.length === 0) return null;

  const allArticles: { keyword: string; title: string; source: string; link: string }[] = [];

  for (const kw of keywords) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(kw.word)}&hl=ja&gl=JP&ceid=JP:ja`;
    const items = await fetchRss(url);
    // Filter to today's articles only
    const todayItems = items.filter(item => isToday(item.pubDate));
    for (const item of todayItems.slice(0, 8)) {
      allArticles.push({
        keyword: kw.word,
        title: item.title,
        source: item.source || "",
        link: item.link,
      });
    }
  }

  if (allArticles.length === 0) return null;

  let articleList = "";
  for (const kw of keywords) {
    const kwArticles = allArticles.filter(a => a.keyword === kw.word);
    if (kwArticles.length === 0) continue;
    articleList += `\n## ${kw.word}\n`;
    for (const a of kwArticles) {
      const src = a.source ? ` (${a.source})` : "";
      articleList += `- ${a.title}${src}\n  URL: ${a.link}\n`;
    }
  }

  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const prompt = `あなたはニュースキュレーターです。以下は本日(${today})に公開された最新ニュースです。

${articleList}

以下のフォーマットでHTML形式のダイジェストを作成してください：
- 各キーワードについて、主要なニュースを2-3文で要約
- 重要なトレンドや注目ポイントがあれば一言コメント
- 各ニュースの出典元（メディア名）を明記してください
- ソースURLをリンクとして含めてください（<a href="URL" target="_blank">メディア名</a>）
- 簡潔で読みやすく、日本語で
- HTMLタグ（h2, p, ul, li, strong, a）を使用
- 全体を<div>で囲む
- 冒頭に今日の全体トレンドを一言でまとめる`;

  const content = await callClaude(prompt);
  const digest = await prisma.digest.create({ data: { content, userId } });
  console.log(`[digest] Generated digest id=${digest.id} for user=${userId}`);
  return { id: digest.id };
}

export async function generateDigestForAll(prisma: PrismaClient): Promise<{ generated: number }> {
  const users = await prisma.user.findMany({ where: { keywords: { some: {} } }, select: { id: true } });
  let generated = 0;
  for (const user of users) {
    try {
      const result = await generateDigest(prisma, user.id);
      if (result) generated++;
    } catch (e) { console.error(`[digest] Error for user ${user.id}:`, e); }
  }
  return { generated };
}
