import { Response } from "express";
import User from "../../models/User.model";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import VideoModel from "../../models/Video.model";
import CourseModel from "../../models/Course.model";
import { getPlaylistDetails } from "../../utils/youtube.config";

export async function handleGetUserDataFunction( req: AuthenticatedRequest, res: Response ) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const data = {
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      uniqueId: user.uniqueId,
      email: user.email,
      emailVerificationStatus: user.emailVerificationStatus,
      profileImageUrl: user.profileImageUrl,
      phoneNumber: user.phoneNumber,
      phoneNumberVerificationStatus: user.phoneNumberVerificationStatus,
      role: user.role,
      bio: user.bio,
      userDob: user.userDob,
      address: user.address,
      enrolledIn: user.enrolledIn,
      bookmarks: user.bookmarks,
      progress : user.progress,  
      history: user.history, 
  };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

export async function handleGetUsersBookmarkedVideo(req: AuthenticatedRequest , res: Response) {
   const userId = req.userId;

   if(!userId){
    return res.status(401).json({success: false , message: "Unauthorized"})
   }

   const {videoIds} = req.body;
 
   if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ success: false, message: 'VideoIds are required' });
  }

  try {

    const videos = await VideoModel.find({ videoId: { $in: videoIds } })
    .lean() 
    .exec();

    if (!videos || videos.length === 0) {
      return res.status(404).json({success: false, message: 'No videos found for the provided IDs'});
    }
    
    const filteredVideos = videos.map((video) => ({
      videoName: video.videoName,
      tutorName: video.tutorName,
      videoType: video.videoType,
      courseId: video.courseId,
      videoId: video.videoId,
      uploadedBy: video.uploadedBy,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      description: video.description ?? '', 
      watchedBy: video.watchedBy ?? [], 
      watchCount: video.watchCount ?? 0, 
      videoTimeStamps: video.videoTimeStamps ?? [], 
      isVerified: video.isVerified,
      markdownContent: video.markdownContent ?? '', 
      pub_id: video.pub_id ?? '', 
    }));
    return res.status(200).json({ success: true, videos : filteredVideos });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({success: false, message: 'An error occurred while fetching videos'});
  }
}
export async function handleGetUsersBookmarkedCourses(req: AuthenticatedRequest , res: Response) {
   const userId = req.userId;

   console.log("🔵 Get Bookmarked Courses Request:", { userId, body: req.body });

   if(!userId){
    console.log("❌ No userId found");
    return res.status(401).json({success: false , message: "Unauthorized"})
   }

   const {courseIds} = req.body;

   console.log("📝 CourseIds received:", courseIds);
 
   if (!Array.isArray(courseIds) || courseIds.length === 0) {
    console.log("❌ Invalid courseIds format or empty");
    return res.status(400).json({ success: false, message: 'CourseIds are required' });
  }

  try {

    const uniqueCourseIds = Array.from(new Set(courseIds));

    const courses = await CourseModel.find({ courseId: { $in: uniqueCourseIds } })
      .lean() // Convert to plain objects
      .exec();

    console.log("✅ Found " + courses.length + " courses in database");

    const foundCourseIds = courses.map((course) => course.courseId);
    const missingCourseIds = uniqueCourseIds.filter(
      (id) => !foundCourseIds.includes(id) && id.startsWith("PL")
    );

    const youtubeCourses = await Promise.all(
      missingCourseIds.map(async (playlistId) => {
        const playlist = await getPlaylistDetails(playlistId);
        if (!playlist) return null;
        return {
          courseName: playlist.snippet.title,
          courseId: playlist.id,
          tutorName: playlist.snippet.channelTitle,
          courseType: "YOUTUBE",
          description: playlist.snippet.description,
          currency: "FREE",
          sellingPrice: 0,
          originalPrice: 0,
          thumbnail:
            playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.medium?.url ||
            playlist.snippet.thumbnails.default.url,
          isVerified: true,
          uploadedBy: "youtube-integration",
          ratings: [],
          likedBy: [],
          enrolledBy: [],
          ratingCount: 0,
          rating: 0,
          likedCount: 0,
          enrolledCount: 0,
          markdownContent: "",
          redirectLink: "",
          videos: [],
        };
      })
    );

    const filteredYoutubeCourses = youtubeCourses.filter(
      (course): course is NonNullable<typeof course> => Boolean(course)
    );

    const filteredCourses = courses.map((course) => ({
      courseName: course.courseName,
      courseId: course.courseId,
      tutorName: course.tutorName,
      courseType: course.courseType,
      description: course.description,
      currency: course.currency,
      sellingPrice: course.sellingPrice,
      originalPrice: course.originalPrice,
      thumbnail: course.thumbnail,
      isVerified: course.isVerified,
      uploadedBy: course.uploadedBy,
      ratings: course.ratings ?? [],
      likedBy: course.likedBy ?? [],
      enrolledBy: course.enrolledBy ?? [],
      ratingCount: course.ratingCount,
      rating: course.rating,
      likedCount: course.likedCount,
      enrolledCount: course.enrolledCount,
      markdownContent: course.markdownContent ?? '',
      redirectLink: course.redirectLink ?? '',
      videos: course.videos ?? [],
    }));

    return res.status(200).json({ success: true, courses: [...filteredCourses, ...filteredYoutubeCourses] });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({success: false, message: 'An error occurred while fetching courses'});
  }
}

export async function handleGetUserHistoryVideos(req: AuthenticatedRequest , res: Response){
  const userId = req.userId; 

  if(!userId){
   return res.status(401).json({success: false , message: "Unauthorized"})
  }

  const {videoIds} = req.body;
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ success: false, message: 'nothing found in history' });
  }

  try {

    const videos = await VideoModel.find({ videoId: { $in: videoIds } }).lean().exec();

    if (!videos || videos.length === 0) {
      return res.status(404).json({success: false, message: 'No videos found for the provided IDs'});
    }

    const filteredVideos = videos.map((video) => ({
      videoName: video.videoName,
      tutorName: video.tutorName,
      videoType: video.videoType,
      courseId: video.courseId,
      videoId: video.videoId,
      uploadedBy: video.uploadedBy,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      description: video.description ?? '', 
      watchedBy: video.watchedBy ?? [], 
      watchCount: video.watchedBy.length ?? 0, 
      videoTimeStamps: video.videoTimeStamps ?? [], 
      isVerified: video.isVerified,
      markdownContent: video.markdownContent ?? '', 
      pub_id: video.pub_id ?? '', 
    }));

    return res.status(200).json({ success: true, videos : filteredVideos });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({success: false, message: 'An error occurred while fetching videos'});
  }
}

// export async function handleGetUsersBookmarkedTest(req: AuthenticatedRequest , res: Response) {
//    const userId = req.userId;

//    if(!userId){
//     return res.status(401).json({success: false , message: "Unauthorized"})
//    }

//    const {testIds} = req.body;
 
//    if (!Array.isArray(testIds) || testIds.length === 0) {
//     return res.status(400).json({ success: false, message: 'VideoIds are required' });
//   }

//   try {

//     const tests = await TestModel.find({
//       _id: { $in: testIds },
//     });

//     if (!tests || tests.length === 0) {
//       return res.status(404).json({success: false, message: 'No tests found for the provided IDs'});
//     }

//     return res.status(200).json({ success: true, tests });

//   } catch (error) {
//     console.error('Error fetching tests:', error);
//     return res.status(500).json({success: false, message: 'An error occurred while fetching tests'});
//   }
// }




