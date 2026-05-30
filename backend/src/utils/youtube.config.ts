import axios from "axios";

interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelId: string;
    channelTitle: string;
  };
}

interface YouTubePlaylistItem {
  contentDetails: {
    itemCount: number;
  };
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search YouTube for playlists by keyword
 * Returns playlists that match the search query
 */
export async function searchYouTubePlaylists(
  searchQuery: string,
  maxResults: number = 20
): Promise<YouTubePlaylist[]> {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return [];
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
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
    const playlists = response.data.items.map((item: any) => ({
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
  } catch (error) {
    console.error("Error searching YouTube playlists:", error);
    return [];
  }
}

/**
 * Get Channel ID from Channel Handle (@channelname)
 * Returns null if API key is not configured
 */
export async function getChannelIdFromHandle(
  channelHandle: string
): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return null;
  }

  try {
    const response = await axios.get(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=${channelHandle}&type=channel&key=${YOUTUBE_API_KEY}`
    );

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet.channelId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching channel ID:", error);
    return null;
  }
}

/**
 * Get all playlists from a YouTube channel
 */
export async function getChannelPlaylists(
  channelId: string
): Promise<YouTubePlaylist[]> {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return [];
  }

  try {
    const playlists: YouTubePlaylist[] = [];
    let pageToken = "";

    // Fetch all playlists (paginated)
    do {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
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
  } catch (error) {
    console.error("Error fetching channel playlists:", error);
    return [];
  }
}

/**
 * Get videos from a specific playlist
 */
export async function getPlaylistVideos(
  playlistId: string,
  maxResults: number = 50
) {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return [];
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        playlistId,
        part: "snippet,contentDetails",
        maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
    return [];
  }
}

/**
 * Get details for a single playlist by ID
 */
export interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    resourceId?: { videoId: string };
  };
}

export async function getPlaylistDetails(
  playlistId: string
): Promise<YouTubePlaylist | null> {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return null;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
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
  } catch (error) {
    console.error(`Error fetching playlist details for ${playlistId}:`, error);
    return null;
  }
}

export async function getVideoDetails(
  videoId: string
): Promise<YouTubeVideoDetails | null> {
  if (!YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY not configured. Please add it to your .env file"
    );
    return null;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
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
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error);
    return null;
  }
}

/**
 * Format YouTube playlists as courses
 */
export function formatPlaylistsAsCourses(
  playlists: YouTubePlaylist[],
  tutorName: string = "YouTube"
) {
  return playlists.map((playlist) => ({
    courseId: playlist.id,
    courseName: playlist.snippet.title,
    tutorName: playlist.snippet.channelTitle || tutorName,
    description:
      playlist.snippet.description ||
      "Learn from this YouTube playlist",
    courseType: "YOUTUBE",
    ratingCount: 0,
    rating: 0,
    thumbnail:
      playlist.snippet.thumbnails.high?.url ||
      playlist.snippet.thumbnails.medium?.url ||
      playlist.snippet.thumbnails.default.url,
    currency: "FREE",
    sellingPrice: 0,
    originalPrice: 0,
    isVerified: true,
    uploadedBy: "youtube-integration",
    playlistId: playlist.id,
    videoCount:
      (playlist as unknown as YouTubePlaylistItem).contentDetails?.itemCount ||
      0,
  }));
}
