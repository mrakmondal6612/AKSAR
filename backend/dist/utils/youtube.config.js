"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchYouTubePlaylists = searchYouTubePlaylists;
exports.getChannelIdFromHandle = getChannelIdFromHandle;
exports.getChannelPlaylists = getChannelPlaylists;
exports.getPlaylistVideos = getPlaylistVideos;
exports.getPlaylistDetails = getPlaylistDetails;
exports.getVideoDetails = getVideoDetails;
exports.formatPlaylistsAsCourses = formatPlaylistsAsCourses;
const axios_1 = __importDefault(require("axios"));
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
/**
 * Search YouTube for playlists by keyword
 * Returns playlists that match the search query
 */
async function searchYouTubePlaylists(searchQuery, maxResults = 20) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY not configured. Please add it to your .env file");
        return [];
    }
    try {
        const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/search`, {
            params: {
                part: "snippet",
                q: searchQuery,
                type: "playlist",
                maxResults,
                key: YOUTUBE_API_KEY,
            },
        });
        if (!response.data.items) {
            return [];
        }
        // Convert search results to playlist format
        const playlists = response.data.items.map((item) => ({
            id: item.id.playlistId,
            snippet: {
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails,
                channelId: item.snippet.channelId,
                channelTitle: item.snippet.channelTitle,
            },
        }));
        return playlists;
    }
    catch (error) {
        console.error("Error searching YouTube playlists:", error);
        return [];
    }
}
/**
 * Get Channel ID from Channel Handle (@channelname)
 * Returns null if API key is not configured
 */
async function getChannelIdFromHandle(channelHandle) {
    if (!YOUTUBE_API_KEY) {
        return null;
    }
    try {
        const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/search?part=snippet&q=${channelHandle}&type=channel&key=${YOUTUBE_API_KEY}`);
        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].snippet.channelId;
        }
        return null;
    }
    catch (error) {
        // Silent error - YouTube API may be unavailable
        return null;
    }
}
/**
 * Get all playlists from a YouTube channel
 */
async function getChannelPlaylists(channelId) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY not configured. Please add it to your .env file");
        return [];
    }
    try {
        const playlists = [];
        let pageToken = "";
        // Fetch all playlists (paginated)
        do {
            const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/playlists`, {
                params: {
                    channelId,
                    part: "snippet,contentDetails",
                    maxResults: 50,
                    pageToken,
                    key: YOUTUBE_API_KEY,
                },
            });
            if (response.data.items) {
                playlists.push(...response.data.items);
            }
            pageToken = response.data.nextPageToken || "";
        } while (pageToken);
        return playlists;
    }
    catch (error) {
        console.error("Error fetching channel playlists:", error);
        return [];
    }
}
/**
 * Get videos from a specific playlist
 */
async function getPlaylistVideos(playlistId, maxResults = 50) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY not configured. Please add it to your .env file");
        return [];
    }
    try {
        const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/playlistItems`, {
            params: {
                playlistId,
                part: "snippet,contentDetails",
                maxResults,
                key: YOUTUBE_API_KEY,
            },
        });
        return response.data.items || [];
    }
    catch (error) {
        console.error("Error fetching playlist videos:", error);
        return [];
    }
}
async function getPlaylistDetails(playlistId) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY not configured. Please add it to your .env file");
        return null;
    }
    try {
        const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/playlists`, {
            params: {
                part: "snippet,contentDetails",
                id: playlistId,
                key: YOUTUBE_API_KEY,
            },
        });
        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }
        return response.data.items[0];
    }
    catch (error) {
        console.error(`Error fetching playlist details for ${playlistId}:`, error);
        return null;
    }
}
async function getVideoDetails(videoId) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY not configured. Please add it to your .env file");
        return null;
    }
    try {
        const response = await axios_1.default.get(`${YOUTUBE_API_BASE}/videos`, {
            params: {
                part: "snippet",
                id: videoId,
                key: YOUTUBE_API_KEY,
            },
        });
        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }
        const item = response.data.items[0];
        return {
            id: item.id,
            snippet: item.snippet,
        };
    }
    catch (error) {
        console.error(`Error fetching video details for ${videoId}:`, error);
        return null;
    }
}
/**
 * Format YouTube playlists as courses
 */
function formatPlaylistsAsCourses(playlists, tutorName = "YouTube") {
    return playlists.map((playlist) => ({
        courseId: playlist.id,
        courseName: playlist.snippet.title,
        tutorName: playlist.snippet.channelTitle || tutorName,
        description: playlist.snippet.description ||
            "Learn from this YouTube playlist",
        courseType: "YOUTUBE",
        ratingCount: 0,
        rating: 0,
        thumbnail: playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.medium?.url ||
            playlist.snippet.thumbnails.default.url,
        currency: "FREE",
        sellingPrice: 0,
        originalPrice: 0,
        isVerified: true,
        uploadedBy: "youtube-integration",
        playlistId: playlist.id,
        videoCount: playlist.contentDetails?.itemCount ||
            0,
    }));
}
