import { Request, Response } from "express";
import VideoModel from "../../models/Video.model";
import { getPlaylistVideos, getVideoDetails } from "../../utils/youtube.config";

export async function handleGetAllVideosOfCourse(req: Request, res: Response) {
  const { courseId } = req.query;

  if (!courseId || typeof courseId !== "string") {
    return res.status(400).json({ success: false, message: "Course ID is required" });
  }

  try {
    const videos = await VideoModel.find({ courseId });

    if (!videos || videos.length === 0) {
      if (courseId.startsWith("PL")) {
        const playlistVideos = await getPlaylistVideos(courseId, 100);

        if (!playlistVideos || playlistVideos.length === 0) {
          return res.status(200).json({
            success: true,
            message: "No videos found for the given course",
            videos: [],
          });
        }

        const transformedPlaylistVideos = playlistVideos.map((video: any) => ({
          videoName: video.snippet.title,
          tutorName: video.snippet.channelTitle,
          videoType: "YOUTUBE",
          courseId,
          videoId: video.contentDetails.videoId,
          uploadedBy: video.snippet.channelTitle,
          thumbnail:
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url ||
            video.snippet.thumbnails.default.url,
          videoUrl: `https://www.youtube.com/watch?v=${video.contentDetails.videoId}`,
          description: video.snippet.description ?? "",
          watchedBy: [],
          watchCount: 0,
          videoTimeStamps: [],
          isVerified: true,
          markdownContent: "",
          pub_id: "",
        }));

        return res.status(200).json({
          success: true,
          message: "All videos of the given course",
          videos: transformedPlaylistVideos,
        });
      }

      return res.status(200).json({
        success: true,
        message: "No videos found for the given course",
        videos: [],
      });
    }

    // Transform videos based on their type
    const transformedVideos = videos.map((video) => {
      const videoResponse = {
        videoName: video.videoName,
        tutorName: video.tutorName,
        videoType: video.videoType,
        courseId: video.courseId,
        videoId: video.videoId,
        uploadedBy: video.uploadedBy,
        thumbnail: video.thumbnail,
        videoUrl: video.videoType === "YOUTUBE" ? video.videoUrl : video.pub_id,
        description: video.description ?? '',
        watchedBy: video.watchedBy ?? [],
        watchCount: video.watchCount ?? 0,
        videoTimeStamps: video.videoTimeStamps ?? [],
        isVerified: video.isVerified,
        markdownContent: video.markdownContent ?? '',
        pub_id: video.pub_id ?? '',
      };

      return videoResponse;
    });

    return res.status(200).json({
      success: true,
      message: "All videos of the given course",
      videos: transformedVideos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function handleGetVideoDataById(req: Request, res: Response) {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== "string") {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  try {
    const video = await VideoModel.findOne({ videoId });

    if (!video) {
      const youtubeVideo = await getVideoDetails(videoId);

      if (!youtubeVideo) {
        return res.status(404).json({ success: false, message: "No video found for the given ID" });
      }

      const responseData = {
        videoName: youtubeVideo.snippet.title,
        tutorName: youtubeVideo.snippet.channelTitle,
        videoType: "YOUTUBE",
        courseId: "youtube-playlist",
        videoId: youtubeVideo.id,
        uploadedBy: youtubeVideo.snippet.channelTitle,
        thumbnail:
          youtubeVideo.snippet.thumbnails.high?.url ||
          youtubeVideo.snippet.thumbnails.medium?.url ||
          youtubeVideo.snippet.thumbnails.default.url,
        videoUrl: `https://www.youtube.com/watch?v=${youtubeVideo.id}`,
        description: youtubeVideo.snippet.description ?? '',
        watchedBy: [],
        watchCount: 0,
        videoTimeStamps: [],
        isVerified: true,
        markdownContent: '',
        pub_id: '',
      };

      return res.status(200).json({
        success: true,
        message: "Video data fetched successfully",
        video: responseData,
      });
    }

    const responseData = {
      videoName: video.videoName,
      tutorName: video.tutorName,
      videoType: video.videoType,
      courseId: video.courseId,
      videoId: video.videoId,
      uploadedBy: video.uploadedBy,
      thumbnail: video.thumbnail,
      videoUrl: video.videoType === "YOUTUBE" ? video.videoUrl : video.pub_id,
      description: video.description ?? '',
      watchedBy: video.watchedBy ?? [],
      watchCount: video.watchCount ?? 0,
      videoTimeStamps: video.videoTimeStamps ?? [],
      isVerified: video.isVerified,
      markdownContent: video.markdownContent ?? '',
      pub_id: video.pub_id ?? '',
    };

    return res.status(200).json({
      success: true,
      message: "Video data fetched successfully",
      video: responseData,
    });
  } catch (error) {
    console.error("Error fetching video data:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
