import { Request, Response } from "express";
import {
  getChannelIdFromHandle,
  getChannelPlaylists,
  formatPlaylistsAsCourses,
  getPlaylistVideos,
  searchYouTubePlaylists,
} from "../../utils/youtube.config";

/**
 * Fetch all playlists from BengaliCoder YouTube channel
 */
export async function handleFetchYouTubeCoursesFunction(
  req: Request,
  res: Response
) {
  try {
    // Get YouTube API key from env
    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(400).json({
        success: false,
        message:
          "YouTube API key not configured. Please add YOUTUBE_API_KEY to .env",
      });
    }

    // Step 1: Get channel ID from @BengaliCoder handle
    const channelHandle = "@BengaliCoder";
    const channelId = await getChannelIdFromHandle(channelHandle);

    if (!channelId) {
      return res.status(200).json({
        success: true,
        data: [],
        totalPlaylists: 0,
        message: `No YouTube playlists found for channel: ${channelHandle}`,
      });
    }

    // Step 2: Get all playlists from the channel
    const playlists = await getChannelPlaylists(channelId);

    if (!playlists || playlists.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        totalPlaylists: 0,
        message: "No playlists found in this channel",
      });
    }

    // Step 3: Format playlists as courses
    const courses = formatPlaylistsAsCourses(playlists, "BengaliCoder");

    return res.status(200).json({
      success: true,
      data: courses,
      totalPlaylists: courses.length,
    });
  } catch (error) {
    console.error("Error fetching YouTube courses:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching YouTube courses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Fetch a specific playlist with its videos
 */
export async function handleFetchYouTubePlaylistVideosFunction(
  req: Request,
  res: Response
) {
  try {
    const { playlistId } = req.params;

    if (!playlistId) {
      return res.status(400).json({
        success: false,
        message: "Playlist ID is required",
      });
    }

    // Fetch videos from playlist
    const videos = await getPlaylistVideos(playlistId);

    if (!videos || videos.length === 0) {
      return res.status(200).json({
        success: true,
        playlistId,
        data: [],
        totalVideos: 0,
        message: "No videos found in this playlist",
      });
    }

    const formattedVideos = videos.map((video: any) => ({
      videoId: video.contentDetails.videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail:
        video.snippet.thumbnails.high?.url ||
        video.snippet.thumbnails.medium?.url ||
        video.snippet.thumbnails.default.url,
      publishedAt: video.snippet.publishedAt,
    }));

    return res.status(200).json({
      success: true,
      playlistId,
      data: formattedVideos,
      totalVideos: formattedVideos.length,
    });
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching playlist videos",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Search YouTube for courses/playlists by keyword
 * Allows users to search across ALL YouTube channels
 */
export async function handleSearchYouTubeCoursesFunction(
  req: Request,
  res: Response
) {
  try {
    const { searchQuery, maxResults = 20 } = req.query;

    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(400).json({
        success: false,
        message:
          "YouTube API key not configured. Please add YOUTUBE_API_KEY to .env",
      });
    }

    // Search YouTube for playlists matching the query
    const playlists = await searchYouTubePlaylists(
      searchQuery,
      Math.min(parseInt(maxResults as string) || 20, 50)
    );

    if (!playlists || playlists.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        searchQuery,
        totalResults: 0,
        message: `No playlists found for search: "${searchQuery}"`,
      });
    }

    // Format playlists as courses
    const courses = formatPlaylistsAsCourses(playlists);

    return res.status(200).json({
      success: true,
      data: courses,
      searchQuery,
      totalResults: courses.length,
    });
  } catch (error) {
    console.error("Error searching YouTube courses:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching YouTube courses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
