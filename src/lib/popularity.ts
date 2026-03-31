// Domain authority bonuses
const DOMAIN_SCORES: Record<string, number> = {};
const DOMAIN_SUFFIX_SCORES: [string, number][] = [
  [".go.jp", 50],     // central government
  [".lg.jp", 40],     // local government
  [".ac.jp", 20],     // academic
  [".ed.jp", 15],     // education
  [".or.jp", 10],     // non-profit / public org
];
const DOMAIN_EXACT_SCORES: Record<string, number> = {
  "prtimes.jp": 15,
  "meti.go.jp": 60,
  "mhlw.go.jp": 60,
  "cao.go.jp": 60,
  "digital.go.jp": 60,
  "ipa.go.jp": 55,
  "jst.go.jp": 50,
  "nhk.or.jp": 30,
};

function getDomainScore(domain: string | null): number {
  if (!domain) return 0;
  const exact = DOMAIN_EXACT_SCORES[domain];
  if (exact) return exact;
  for (const [suffix, score] of DOMAIN_SUFFIX_SCORES) {
    if (domain.endsWith(suffix)) return score;
  }
  return 0;
}

async function fetchHatenaCount(url: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://bookmark.hatenaapis.com/count/entry?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const count = await res.json();
    return typeof count === "number" ? count : 0;
  } catch { return 0; }
}

async function fetchHNScore(url: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(url)}&restrictSearchableAttributes=url&hitsPerPage=3`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (!data.hits || data.hits.length === 0) return 0;
    // Sum points from matching stories
    let total = 0;
    for (const hit of data.hits) {
      if (hit.url === url || hit.url?.includes(new URL(url).hostname)) {
        total += (hit.points || 0);
      }
    }
    return total;
  } catch { return 0; }
}

export async function fetchPopularity(url: string): Promise<number> {
  let domain: string | null = null;
  try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}

  const [hatena, hn] = await Promise.all([
    fetchHatenaCount(url),
    fetchHNScore(url),
  ]);

  const domainScore = getDomainScore(domain);

  // Composite score:
  // - Hatena bookmarks (direct signal, weight 1x)
  // - HN points (international signal, weight 0.5x since less relevant for JP)
  // - Domain authority (fixed bonus for trustworthy sources)
  const score = Math.round(hatena + hn * 0.5 + domainScore);

  return score;
}
