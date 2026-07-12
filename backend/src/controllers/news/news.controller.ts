import { Request, Response } from "express";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  source: string;
  category: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  readTime: string;
  upvotes: number;
  tags: string[];
}

interface Cache {
  data: NewsItem[] | null;
  lastFetched: number;
}

const cache: Cache = {
  data: null,
  lastFetched: 0,
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const userAgent = "aksar-web:edu-aggregator:v1.0.0 (by /u/mrakmondal)";

// Decode standard HTML entities
function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Strip HTML tags for clean text snippets
function stripHtml(html: string): string {
  if (!html) return "";
  let text = html.replace(/<[^>]*>?/gm, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// 1. Fetch Aggregated News Feed (JSON Dev.to + RSS Reddit Multi-subreddit)
export async function handleFetchNewsFunction(req: Request, res: Response) {
  const now = Date.now();
  const bypassCache = req.query.bypassCache === "true";

  // Return cache if it is still valid and cache bypass is not requested
  if (!bypassCache && cache.data && (now - cache.lastFetched < CACHE_DURATION)) {
    console.log("Serving news from cache");
    return res.status(200).json({
      success: true,
      message: "News fetched successfully (cached)",
      data: cache.data,
    });
  }

  console.log(`Fetching fresh news (bypassCache: ${bypassCache})...`);

  const devToTags = ["education", "learning", "edtech"];
  const redditSubs = ["JEENEETards", "ApplyingToCollege", "GATEtard", "UPSC", "education", "edtech", "learning"];
  const multiSubString = redditSubs.join("+");

  const fetchPromises = [];

  // Prepare Dev.to fetches
  for (const tag of devToTags) {
    fetchPromises.push(
      fetch(`https://dev.to/api/articles?tag=${tag}&per_page=35`, {
        headers: { "User-Agent": userAgent },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Dev.to tag ${tag} status ${response.status}`);
          }
          const items = await response.json();
          return { type: "devto", tag, items };
        })
        .catch((error) => {
          console.error(`Error Dev.to tag ${tag}:`, error.message);
          return { type: "devto", tag, items: [], error };
        })
    );
  }

  // Prepare Reddit RSS multi-subreddit fetch (exactly 1 request to avoid 429/403)
  fetchPromises.push(
    fetch(`https://www.reddit.com/r/${multiSubString}/.rss`, {
      headers: { "User-Agent": userAgent },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Reddit multi-sub RSS status ${response.status}`);
        }
        const xmlText = await response.text();
        return { type: "reddit-rss", xmlText };
      })
      .catch((error) => {
        console.error(`Error Reddit multi-sub RSS:`, error.message);
        return { type: "reddit-rss", xmlText: "", error };
      })
  );

  try {
    const results = await Promise.all(fetchPromises);
    const aggregatedList: NewsItem[] = [];
    const seenIds = new Set<string>();

    for (const res of results) {
      if (res.type === "devto") {
        const devtoRes = res as any;
        const items = devtoRes.items as any[];
        for (const item of items) {
          const uniqueId = `devto-${item.id}`;
          if (seenIds.has(uniqueId)) continue;
          seenIds.add(uniqueId);

          let category = "Tutorials";
          const tagsLower = (item.tag_list || []).map((t: string) => t.toLowerCase());
          if (tagsLower.includes("edtech") || tagsLower.includes("technology") || tagsLower.includes("programming") || tagsLower.includes("webdev")) {
            category = "Technology";
          }

          aggregatedList.push({
            id: uniqueId,
            title: item.title,
            description: item.description || "Educational content and programming tutorials from Dev.to community.",
            contentUrl: item.url,
            source: "Dev.to",
            category: category,
            author: item.user?.name || "Dev.to Writer",
            publishedAt: item.published_at || new Date().toISOString(),
            coverImage: item.cover_image || item.social_image || null,
            readTime: item.reading_time_minutes ? `${item.reading_time_minutes} min read` : "3 min read",
            upvotes: item.public_reactions_count || 0,
            tags: item.tag_list || [],
          });
        }
      } else if (res.type === "reddit-rss") {
        const rssRes = res as any;
        if (!rssRes.xmlText) continue;

        // Parse entry nodes via regex
        const entryMatches = rssRes.xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        for (const entryXml of entryMatches) {
          const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = entryXml.match(/<link href="([\s\S]*?)"/);
          const authorMatch = entryXml.match(/<author><name>([\s\S]*?)<\/name>/);
          const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
          const idMatch = entryXml.match(/<id>([\s\S]*?)<\/id>/);
          const contentMatch = entryXml.match(/<content type="html">([\s\S]*?)<\/content>/);
          const subMatch = entryXml.match(/<category term="([^"]+)"/);

          let idVal = "";
          if (idMatch) {
            const parts = idMatch[1].split("_");
            idVal = parts[parts.length - 1] || idMatch[1];
          }

          const uniqueId = `reddit-${idVal}`;
          if (seenIds.has(uniqueId)) continue;
          seenIds.add(uniqueId);

          const sub = subMatch ? subMatch[1] : "education";
          const titleVal = decodeEntities(titleMatch ? titleMatch[1] : "Reddit Post");
          const contentHtml = contentMatch ? contentMatch[1] : "";
          
          // Truncate clean description text
          let descriptionVal = stripHtml(decodeEntities(contentHtml));
          if (descriptionVal.length > 220) {
            descriptionVal = descriptionVal.slice(0, 220) + "...";
          }

          // Extract image from RSS content
          const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
          const coverImage = imgMatch ? decodeEntities(imgMatch[1]) : null;

          // Category mapping based on subreddits
          let category = "Discussions";
          if (sub === "education") {
            category = "News & Reports";
          } else if (sub === "edtech") {
            category = "Technology";
          } else if (["JEENEETards", "ApplyingToCollege", "GATEtard", "UPSC"].includes(sub)) {
            category = "Entrance Exams";
          }

          const contentUrl = linkMatch ? linkMatch[1] : `https://www.reddit.com/r/${sub}`;
          const authorVal = authorMatch ? authorMatch[1].replace(/^\/u\//, "u/") : "reddit_user";

          aggregatedList.push({
            id: uniqueId,
            title: titleVal,
            description: descriptionVal || "Educational discussion and news feed from Reddit community.",
            contentUrl: contentUrl,
            source: `Reddit /r/${sub}`,
            category: category,
            author: authorVal,
            publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
            coverImage: coverImage,
            readTime: "3 min read",
            upvotes: 1, // RSS feeds do not show score, default to 1
            tags: [sub],
          });
        }
      }
    }

    // Sort by publication date descending
    aggregatedList.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Update Cache
    if (aggregatedList.length > 0) {
      cache.data = aggregatedList;
      cache.lastFetched = now;
    }

    return res.status(200).json({
      success: true,
      message: "News fetched successfully",
      data: cache.data || [],
    });
  } catch (error: any) {
    console.error("Error aggregating news:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch news from external platforms",
      error: error.message,
    });
  }
}

// 2. Fetch Single News / Discussion Details (Dev.to JSON + Reddit Thread RSS comments)
export async function handleFetchNewsDetailsFunction(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "News item ID is required",
    });
  }

  const separatorIndex = id.indexOf("-");
  if (separatorIndex === -1) {
    return res.status(400).json({
      success: false,
      message: "Invalid news item ID format",
    });
  }

  const platform = id.substring(0, separatorIndex);
  const rawId = id.substring(separatorIndex + 1);

  try {
    if (platform === "devto") {
      const response = await fetch(`https://dev.to/api/articles/${rawId}`, {
        headers: { "User-Agent": userAgent },
      });

      if (!response.ok) {
        throw new Error(`Dev.to details responded with status ${response.status}`);
      }

      const article = await response.json();

      return res.status(200).json({
        success: true,
        data: {
          id: id,
          title: article.title,
          description: article.description,
          content: article.body_html || `<p>${article.description}</p>`,
          contentType: "html",
          contentUrl: article.url,
          source: "Dev.to",
          author: article.user?.name || "Dev.to Writer",
          publishedAt: article.published_at || new Date().toISOString(),
          coverImage: article.cover_image || article.social_image || null,
          upvotes: article.public_reactions_count || 0,
          tags: article.tag_list || [],
        },
      });
    } else if (platform === "reddit") {
      try {
        console.log(`Fetching Reddit RSS comments for ID: ${rawId}`);
        const response = await fetch(`https://www.reddit.com/comments/${rawId}/.rss`, {
          headers: { "User-Agent": userAgent },
        });

        if (!response.ok) {
          throw new Error(`Reddit thread RSS details responded with status ${response.status}`);
        }

        const xmlText = await response.text();
        const entryMatches = xmlText.match(/<entry>[\s\S]*? </g) 
          ? xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || []
          : [];

        if (entryMatches.length === 0) {
          throw new Error("No entries found in Reddit thread RSS");
        }

        // First entry represents the thread post itself
        const postXml = entryMatches[0];
        const titleMatch = postXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = postXml.match(/<link href="([\s\S]*?)"/);
        const authorMatch = postXml.match(/<author><name>([\s\S]*?)<\/name>/);
        const publishedMatch = postXml.match(/<published>([\s\S]*?)<\/published>/);
        const contentMatch = postXml.match(/<content type="html">([\s\S]*?)<\/content>/);
        const subMatch = postXml.match(/<category term="([^"]+)"/);

        const sub = subMatch ? subMatch[1] : "education";
        const titleVal = decodeEntities(titleMatch ? titleMatch[1] : "Reddit Post");
        const postHtml = contentMatch ? contentMatch[1] : "";
        const postBodyText = stripHtml(decodeEntities(postHtml));

        // Extract image
        const imgMatch = postHtml.match(/<img[^>]+src="([^">]+)"/);
        const coverImage = imgMatch ? decodeEntities(imgMatch[1]) : null;

        // Rest of the entries represent the comments thread
        const comments = entryMatches.slice(1).map((entryXml) => {
          const cAuthorMatch = entryXml.match(/<author><name>([\s\S]*?)<\/name>/);
          const cPublishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
          const cContentMatch = entryXml.match(/<content type="html">([\s\S]*?)<\/content>/);

          const cAuthor = cAuthorMatch ? cAuthorMatch[1].replace(/^\/u\//, "u/") : "reddit_user";
          const cHtml = cContentMatch ? cContentMatch[1] : "";
          const cBody = stripHtml(decodeEntities(cHtml));

          return {
            author: cAuthor,
            body: cBody,
            score: 1, // RSS doesn't expose comments score, default to 1
            created_utc: cPublishedMatch ? new Date(cPublishedMatch[1]).getTime() / 1000 : Date.now() / 1000,
          };
        });

        return res.status(200).json({
          success: true,
          data: {
            id: id,
            title: titleVal,
            description: postBodyText || "Join the Reddit discussion thread.",
            content: postBodyText || "",
            contentType: "reddit-discussion",
            contentUrl: linkMatch ? linkMatch[1] : `https://www.reddit.com/r/${sub}`,
            source: `Reddit /r/${sub}`,
            author: authorMatch ? authorMatch[1].replace(/^\/u\//, "u/") : "reddit_user",
            publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
            coverImage: coverImage,
            upvotes: 1,
            tags: [sub],
            comments: comments,
            isSelfPost: !postHtml.includes("submitted by") || !postHtml.includes("href"),
          },
        });
      } catch (redditError: any) {
        console.warn(`Reddit live RSS fetch failed: ${redditError.message}. Falling back to cache.`);

        const cachedItem = cache.data ? cache.data.find((item) => item.id === id) : null;
        if (cachedItem) {
          return res.status(200).json({
            success: true,
            data: {
              id: cachedItem.id,
              title: cachedItem.title,
              description: cachedItem.description,
              content: cachedItem.description,
              contentType: "reddit-discussion",
              contentUrl: cachedItem.contentUrl,
              source: cachedItem.source,
              author: cachedItem.author,
              publishedAt: cachedItem.publishedAt,
              coverImage: cachedItem.coverImage,
              upvotes: cachedItem.upvotes,
              tags: cachedItem.tags,
              comments: [],
              isSelfPost: true,
            },
          });
        }

        // If not in cache (e.g. server restarted), return a clean dynamic fallback item
        console.warn(`Article ${id} not found in cache. Generating dynamic fallback response.`);
        return res.status(200).json({
          success: true,
          data: {
            id: id,
            title: `Reddit Educational Thread (${rawId})`,
            description: "Discussion thread from Reddit community. Live details could not be loaded due to temporary rate-limiting.",
            content: "We could not load the discussion content from Reddit RSS at this moment. You can view the live discussion thread directly on Reddit using the link below.",
            contentType: "reddit-discussion",
            contentUrl: `https://www.reddit.com/comments/${rawId}`,
            source: `Reddit`,
            author: "reddit_user",
            publishedAt: new Date().toISOString(),
            coverImage: null,
            upvotes: 1,
            tags: ["education"],
            comments: [],
            isSelfPost: false,
          },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Unknown platform prefix: ${platform}`,
      });
    }
  } catch (error: any) {
    console.error(`Error fetching news details for ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch details for news item",
      error: error.message,
    });
  }
}
