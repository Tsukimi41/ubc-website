import "server-only";
import { unstable_cache } from "next/cache";
import { fallbackDiary, fallbackUpdates } from "@/lib/fallback-data";
import { parseHostAllowList, safeExternalUrl } from "@/lib/safe-url";
import { readBodyWithLimit } from "@/lib/security";
import type { DiaryEntry, Update } from "@/lib/types";

const MAX_CMS_RESPONSE_BYTES = 1_048_576;

function boundedText(value: unknown, maximum: number, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maximum) || fallback;
}

function cleanTumblrBody(html: unknown) {
  return boundedText(typeof html === "string" ? html.replace(/<[^>]{0,1000}>/gu, " ") : "", 240);
}

function safeDate(value: unknown, fallback: string) {
  if (typeof value !== "string" || value.length > 64) return fallback;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.UTC(2000, 0, 1) && timestamp < Date.now() + 86_400_000
    ? new Date(timestamp).toISOString()
    : fallback;
}

async function boundedJson(response: Response): Promise<unknown> {
  const body = await readBodyWithLimit(response, MAX_CMS_RESPONSE_BYTES);
  if (!body.ok) throw new Error(`CMS response rejected with ${body.status}`);
  return JSON.parse(body.raw) as unknown;
}

async function fetchTumblr(tag = "news"): Promise<Update[]> {
  const apiKey = process.env.TUMBLR_API_KEY?.trim();
  const blog = process.env.TUMBLR_BLOG_IDENTIFIER?.trim();
  if (!apiKey || !blog) return fallbackUpdates;

  try {
    const url = new URL(`https://api.tumblr.com/v2/blog/${encodeURIComponent(blog)}/posts`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("tag", tag);
    url.searchParams.set("limit", "6");
    const response = await fetch(url, {
      next: { revalidate: 300, tags: ["tumblr"] },
      redirect: "error",
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) throw new Error(`Tumblr returned ${response.status}`);
    const payload = await boundedJson(response) as { response?: { posts?: unknown } };
    const posts = Array.isArray(payload.response?.posts) ? payload.response.posts.slice(0, 6) : [];
    const linkHosts = parseHostAllowList(process.env.TUMBLR_ALLOWED_LINK_HOSTS);
    const imageHosts = parseHostAllowList(process.env.CMS_IMAGE_HOSTS);
    const fallbackDate = new Date().toISOString();

    return posts.flatMap((candidate, index): Update[] => {
      if (!candidate || typeof candidate !== "object") return [];
      const post = candidate as Record<string, unknown>;
      const trail = Array.isArray(post.trail) && post.trail[0] && typeof post.trail[0] === "object"
        ? post.trail[0] as Record<string, unknown>
        : undefined;
      const content = Array.isArray(trail?.content) ? trail.content.slice(0, 50) : [];
      const textBlock = content.find((block) => block && typeof block === "object" && (block as Record<string, unknown>).type === "text") as Record<string, unknown> | undefined;
      const imageBlock = content.find((block) => block && typeof block === "object" && (block as Record<string, unknown>).type === "image") as Record<string, unknown> | undefined;
      const media = Array.isArray(imageBlock?.media) && imageBlock.media[0] && typeof imageBlock.media[0] === "object"
        ? imageBlock.media[0] as Record<string, unknown>
        : undefined;
      const rawBody = textBlock?.text ?? post.summary ?? post.caption ?? "";
      const id = boundedText(post.id_string ?? post.id, 128, `tumblr-${index}`);
      return [{
        id,
        title: boundedText(post.summary, 160, "ハチたちからの便り"),
        body: cleanTumblrBody(rawBody),
        date: safeDate(post.date, fallbackDate),
        url: safeExternalUrl(post.post_url, linkHosts),
        imageUrl: safeExternalUrl(media?.url, imageHosts),
        tags: Array.isArray(post.tags) ? post.tags.slice(0, 20).map((item) => boundedText(item, 64)).filter(Boolean) : [],
      }];
    });
  } catch (error) {
    console.error("Tumblr fetch failed; using fallback content", error instanceof Error ? error.name : "unknown_error");
    return fallbackUpdates;
  }
}

function notionText(property: unknown): string {
  if (!property || typeof property !== "object") return "";
  const value = property as { title?: unknown; rich_text?: unknown };
  const title = Array.isArray(value.title) ? value.title : [];
  const richText = Array.isArray(value.rich_text) ? value.rich_text : [];
  return [...title, ...richText]
    .slice(0, 100)
    .map((item) => item && typeof item === "object" ? boundedText((item as Record<string, unknown>).plain_text, 500) : "")
    .join("");
}

async function fetchNotion(): Promise<DiaryEntry[]> {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  if (!token || !databaseId) return fallbackDiary;
  if (!/^[A-Za-z0-9-]{8,64}$/u.test(databaseId)) {
    console.error("Notion database ID is invalid");
    return fallbackDiary;
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${encodeURIComponent(databaseId)}/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: "ステータス", select: { equals: "公開" } }, sorts: [{ property: "公開日", direction: "descending" }], page_size: 12 }),
      next: { revalidate: 900, tags: ["notion"] },
      redirect: "error",
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) throw new Error(`Notion returned ${response.status}`);
    const payload = await boundedJson(response) as { results?: unknown };
    const results = Array.isArray(payload.results) ? payload.results.slice(0, 12) : [];
    const linkHosts = parseHostAllowList(process.env.NOTION_ALLOWED_LINK_HOSTS);
    const imageHosts = parseHostAllowList(process.env.CMS_IMAGE_HOSTS);
    const fallbackDate = new Date().toISOString();

    return results.flatMap((candidate, index): DiaryEntry[] => {
      if (!candidate || typeof candidate !== "object") return [];
      const page = candidate as Record<string, unknown>;
      if (!page.properties || typeof page.properties !== "object") return [];
      const properties = page.properties as Record<string, unknown>;
      const date = properties["公開日"] as { date?: { start?: unknown } } | undefined;
      const category = properties["カテゴリ"] as { select?: { name?: unknown } } | undefined;
      const cover = page.cover as { external?: { url?: unknown }; file?: { url?: unknown } } | undefined;
      return [{
        id: boundedText(page.id, 128, `notion-${index}`),
        title: boundedText(notionText(properties["タイトル"]), 200, "無題の記録"),
        excerpt: boundedText(notionText(properties["概要"]), 600),
        publishedAt: safeDate(date?.date?.start, safeDate(page.created_time, fallbackDate)),
        category: boundedText(category?.select?.name, 80, "養蜂日誌"),
        imageUrl: safeExternalUrl(cover?.external?.url ?? cover?.file?.url, imageHosts),
        url: safeExternalUrl(page.url, linkHosts),
      }];
    });
  } catch (error) {
    console.error("Notion fetch failed; using fallback content", error instanceof Error ? error.name : "unknown_error");
    return fallbackDiary;
  }
}

export const getLatestUpdates = unstable_cache(() => fetchTumblr("news"), ["latest-updates"], { revalidate: 300 });
export const getGalleryUpdates = unstable_cache(() => fetchTumblr("gallery"), ["gallery-updates"], { revalidate: 300 });
export const getDiaryEntries = unstable_cache(fetchNotion, ["diary-entries"], { revalidate: 900 });
