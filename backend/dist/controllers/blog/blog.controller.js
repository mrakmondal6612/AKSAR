"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFetchBlogsFunction = handleFetchBlogsFunction;
const cache = {
    data: null,
    lastFetched: 0,
};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
// Helper to decode Reddit's preview URL entities
function decodeRedditImageUrl(url) {
    if (!url)
        return "";
    return url.replace(/&amp;/g, "&");
}
async function handleFetchBlogsFunction(req, res) {
    const now = Date.now();
    const bypassCache = req.query.bypassCache === "true";
    // Return cache if it is still valid and cache bypass is not requested
    if (!bypassCache && cache.data && (now - cache.lastFetched < CACHE_DURATION)) {
        console.log("Serving blogs from cache");
        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully (cached)",
            data: cache.data,
        });
    }
    console.log(`Fetching fresh blogs from external platforms (bypassCache: ${bypassCache})...`);
    const devToTags = ["education", "learning", "edtech"];
    const redditSubreddits = ["education", "edtech", "learning"];
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AKSAR-Education-Aggregator/1.0";
    const fetchPromises = [];
    // Prepare Dev.to fetches (higher limit for more blogs)
    for (const tag of devToTags) {
        fetchPromises.push(fetch(`https://dev.to/api/articles?tag=${tag}&per_page=45`, {
            headers: { "User-Agent": userAgent },
        })
            .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Dev.to tag ${tag} responded with status ${response.status}`);
            }
            const items = await response.json();
            return { type: "devto", tag, items };
        })
            .catch((error) => {
            console.error(`Error fetching Dev.to tag ${tag}:`, error.message);
            return { type: "devto", tag, items: [], error };
        }));
    }
    // Prepare Reddit fetches (Hot + New for real-time news)
    for (const sub of redditSubreddits) {
        // Fetch hot posts
        fetchPromises.push(fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=30`, {
            headers: { "User-Agent": userAgent },
        })
            .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Reddit r/${sub} hot responded with status ${response.status}`);
            }
            const data = await response.json();
            return { type: "reddit", subreddit: sub, items: data.data?.children || [] };
        })
            .catch((error) => {
            console.error(`Error fetching Reddit r/${sub} hot:`, error.message);
            return { type: "reddit", subreddit: sub, items: [], error };
        }));
        // Fetch new posts (real-time updates)
        fetchPromises.push(fetch(`https://www.reddit.com/r/${sub}/new.json?limit=25`, {
            headers: { "User-Agent": userAgent },
        })
            .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Reddit r/${sub} new responded with status ${response.status}`);
            }
            const data = await response.json();
            return { type: "reddit", subreddit: sub, items: data.data?.children || [] };
        })
            .catch((error) => {
            console.error(`Error fetching Reddit r/${sub} new:`, error.message);
            return { type: "reddit", subreddit: sub, items: [], error };
        }));
    }
    try {
        const results = await Promise.all(fetchPromises);
        const aggregatedList = [];
        const seenIds = new Set();
        for (const res of results) {
            if (res.type === "devto") {
                const devtoRes = res;
                const items = devtoRes.items;
                for (const item of items) {
                    const uniqueId = `devto-${item.id}`;
                    if (seenIds.has(uniqueId))
                        continue;
                    seenIds.add(uniqueId);
                    // Determine category based on tags
                    let category = "Tutorials";
                    const tagsLower = (item.tag_list || []).map((t) => t.toLowerCase());
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
            }
            else if (res.type === "reddit") {
                const redditRes = res;
                const items = redditRes.items;
                const sub = redditRes.subreddit;
                for (const item of items) {
                    const postData = item.data;
                    if (!postData || postData.pinned || postData.stickied)
                        continue;
                    const uniqueId = `reddit-${postData.id}`;
                    if (seenIds.has(uniqueId))
                        continue;
                    seenIds.add(uniqueId);
                    // Get clean description (truncate if selftext is long)
                    let description = postData.selftext || "";
                    if (description.length > 220) {
                        description = description.slice(0, 220) + "...";
                    }
                    if (!description && postData.url) {
                        description = `Shared article: ${postData.title}. Read the full story or join the discussion.`;
                    }
                    // Resolve cover image from Reddit preview
                    let coverImage = null;
                    if (postData.preview?.images?.[0]?.source?.url) {
                        coverImage = decodeRedditImageUrl(postData.preview.images[0].source.url);
                    }
                    else if (postData.thumbnail && postData.thumbnail.startsWith("http")) {
                        coverImage = postData.thumbnail;
                    }
                    // Category mapping based on subreddit
                    let category = "Discussions";
                    if (sub === "education") {
                        category = "News & Reports";
                    }
                    else if (sub === "edtech") {
                        category = "Technology";
                    }
                    // Content URL should link to the shared external link if it's not a self-post
                    const isSelfPost = postData.is_self;
                    const contentUrl = isSelfPost
                        ? `https://www.reddit.com${postData.permalink}`
                        : postData.url;
                    // Estimate reading time based on selftext length
                    const wordCount = (postData.selftext || "").split(/\s+/).length;
                    const estimatedMinutes = Math.max(2, Math.ceil(wordCount / 200));
                    aggregatedList.push({
                        id: uniqueId,
                        title: postData.title,
                        description: description || "Educational discussion and news feed from Reddit community.",
                        contentUrl: contentUrl,
                        source: `Reddit /r/${sub}`,
                        category: category,
                        author: `u/${postData.author || "reddit_user"}`,
                        publishedAt: new Date(postData.created_utc * 1000).toISOString(),
                        coverImage: coverImage,
                        readTime: `${estimatedMinutes} min read`,
                        upvotes: postData.score || 0,
                        tags: [sub],
                    });
                }
            }
        }
        // Sort by publication date descending
        aggregatedList.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        // Update Cache (only if we got any data)
        if (aggregatedList.length > 0) {
            cache.data = aggregatedList;
            cache.lastFetched = now;
        }
        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully",
            data: cache.data || [],
        });
    }
    catch (error) {
        console.error("Error in blogs aggregation controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch blogs from external platforms",
            error: error.message,
        });
    }
}
