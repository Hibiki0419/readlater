import { PrismaClient } from "@prisma/client";
import { JSDOM } from "jsdom";
import { fetchArticleData } from "./fetch-title";

import { fetchPopularity } from "./popularity";
type RssItem = { title: string; link: string };

async function resolveRedirect(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadLater/1.0)" } });
    clearTimeout(timeout);
    return res.url || url;
  } catch { return url; }
}

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
      if (link) items.push({ title, link: link.trim() });
    });
    if (items.length === 0) {
      doc.querySelectorAll("entry").forEach((entry) => {
        const title = entry.querySelector("title")?.textContent || "";
        const linkEl = entry.querySelector("link[href]");
        const link = linkEl?.getAttribute("href") || "";
        if (link) items.push({ title, link: link.trim() });
      });
    }
    return items;
  } catch {
    console.error(`[feed-checker] Failed to fetch RSS: ${url}`);
    return [];
  }
}

function buildGoogleNewsUrl(keyword: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=JP&ceid=JP:ja`;
}

async function ensureTag(prisma: PrismaClient, name: string, userId: number): Promise<number> {
  const tag = await prisma.tag.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, color: "#10b981", userId },
  });
  return tag.id;
}

async function addArticle(prisma: PrismaClient, item: RssItem, tagId: number, userId: number, isGoogleNews: boolean): Promise<boolean> {
  let articleUrl = item.link;
  if (isGoogleNews && item.link.includes("news.google.com")) {
    articleUrl = await resolveRedirect(item.link);
  }
  const exists = await prisma.article.findFirst({ where: { url: articleUrl, userId } });
  if (exists) return false;
  const [{ title: fetchedTitle, domain, content, excerpt }, popularity] = await Promise.all([fetchArticleData(articleUrl), fetchPopularity(articleUrl)]);
  const title = item.title || fetchedTitle || null;
  const article = await prisma.article.create({
    data: { url: articleUrl, title, domain, content, excerpt, popularity, userId, tags: { create: [{ tagId }] } },
  });
  console.log(`[feed-checker] Added: ${article.title} (id=${article.id}, user=${userId})`);
  return true;
}

export async function checkFeedsForUser(prisma: PrismaClient, userId: number): Promise<{ added: number }> {
  const keywords = await prisma.keyword.findMany({ where: { userId } });
  const feeds = await prisma.feed.findMany({ where: { userId } });
  let added = 0;

  for (const kw of keywords) {
    const tagId = await ensureTag(prisma, kw.word, userId);
    const items = await fetchRss(buildGoogleNewsUrl(kw.word));
    for (const item of items.slice(0, 5)) {
      try { if (await addArticle(prisma, item, tagId, userId, true)) added++; } catch (e) { console.error(`[feed-checker] Error:`, e); }
    }
  }

  if (keywords.length > 0 && feeds.length > 0) {
    const patterns = keywords.map((kw) => ({ word: kw.word, regex: new RegExp(kw.word, "i") }));
    for (const feed of feeds) {
      const items = await fetchRss(feed.url);
      for (const item of items.slice(0, 20)) {
        const matched = patterns.find((p) => p.regex.test(item.title) || p.regex.test(item.link));
        if (!matched) continue;
        try {
          const tagId = await ensureTag(prisma, matched.word, userId);
          if (await addArticle(prisma, item, tagId, userId, false)) added++;
        } catch (e) { console.error(`[feed-checker] Error:`, e); }
      }
    }
  }

  console.log(`[feed-checker] User ${userId}: Added ${added} articles.`);
  return { added };
}

export async function checkFeedsForAll(prisma: PrismaClient): Promise<{ added: number }> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;
  for (const user of users) {
    const result = await checkFeedsForUser(prisma, user.id);
    total += result.added;
  }
  console.log(`[feed-checker] All users: Added ${total} articles.`);
  return { added: total };
}
