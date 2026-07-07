"use strict";
// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedVideoUrl = void 0;
exports.getPublicIdFromPath = getPublicIdFromPath;
exports.cloudinaryUploadUserImageFiles = cloudinaryUploadUserImageFiles;
exports.cloudinaryUploadCourseImageFiles = cloudinaryUploadCourseImageFiles;
exports.cloudinaryUploadVideoImageFiles = cloudinaryUploadVideoImageFiles;
exports.cloudinaryUploadVideoFiles = cloudinaryUploadVideoFiles;
exports.cloudinaryDeleteImage = cloudinaryDeleteImage;
exports.cloudinaryDeleteUserImage = cloudinaryDeleteUserImage;
exports.cloudinaryDeleteCourseImage = cloudinaryDeleteCourseImage;
exports.cloudinaryDeleteVideoImage = cloudinaryDeleteVideoImage;
exports.cloudinaryDeleteVideoFile = cloudinaryDeleteVideoFile;
// dotenv.config();
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
//   api_key: process.env.CLOUDINARY_API_KEY!,
//   api_secret: process.env.CLOUDINARY_API_SECRET!,
// });
// export function getPublicIdFromPath(cloudinaryPath: string): string {
//   const parts = cloudinaryPath.split('/');
//   return parts[parts.length - 1]; // Returns the last part as public ID
// }
// export const getSignedVideoUrl = (publicId: string): string => {
//   return cloudinary.url(publicId, {
//     resource_type: "video",
//     type: "upload",
//     sign_url: true,
//     expires_at: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins expiry
//   });
// };
// export async function cloudinaryUploadUserImageFiles(localFilePath: string) {
//   if (!localFilePath) {
//     return null;
//   } else {
//     try {
//       const response = await cloudinary.uploader.upload(localFilePath, {
//         resource_type: "auto",
//         folder: "userImages",
//       });
//       return {
//         url: response.secure_url,
//         public_id: response.public_id,
//       };
//     } catch (error) {
//       return null;
//     }
//   }
// }
// export async function cloudinaryUploadCourseImageFiles(localFilePath: string) {
//   if (!localFilePath) {
//     return null;
//   } else {
//     try {
//       const response = await cloudinary.uploader.upload(localFilePath, {
//         resource_type: "auto",
//         folder: "courseImages",
//       });
//       return {
//         url: response.secure_url,
//         public_id: response.public_id,
//       };
//     } catch (error) {
//       return null;
//     }
//   }
// }
// export async function cloudinaryUploadVideoImageFiles(localFilePath: string) {
//   if (!localFilePath) {
//     return null;
//   } else {
//     try {
//       const response = await cloudinary.uploader.upload(localFilePath, {
//         resource_type: "auto",
//         folder: "videoImages",
//       });
//       return {
//         url: response.secure_url,
//         public_id: response.public_id,
//       };
//     } catch (error) {
//       return null;
//     }
//   }
// }
// export async function cloudinaryUploadVideoFiles(localFilePath: string) {
//   if (!localFilePath) {
//     return null;
//   } else {
//     try {
//       const response = await cloudinary.uploader.upload(localFilePath, {
//         resource_type: "auto",
//         folder: "VideoFiles",
//       });
//       return {
//         url: response.secure_url,
//         public_id: response.public_id,
//       };
//     } catch (error) {
//       return null;
//     }
//   }
// }
// export async function cloudinaryDeleteUserImage(ImageUrl: string) {
//   if (!ImageUrl) {
//     return null;
//   }
//   const publicId = `userImages/${extractPublicIdFromUrl(ImageUrl)}`;
//   if (!publicId) {
//     return null;
//   }
//   try {
//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: "image",
//     });
//     return result;
//   } catch (error) {
//     console.error("Error deleting user image:", error);
//     return null;
//   }
// }
// export async function cloudinaryDeleteCourseImage(ImageUrl: string) {
//   if (!ImageUrl) {
//     return null;
//   }
//   const publicId = `courseImages/${extractPublicIdFromUrl(ImageUrl)}`;
//   if (!publicId) {
//     return null;
//   }
//   try {
//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: "image",
//     });
//     return result;
//   } catch (error) {
//     console.error("Error deleting course image:", error);
//     return null;
//   }
// }
// export async function cloudinaryDeleteVideoImage(ImageUrl: string) {
//   if (!ImageUrl) {
//     return null;
//   }
//   const publicId = `videoImages/${extractPublicIdFromUrl(ImageUrl)}`;
//   if (!publicId) {
//     return null;
//   }
//   try {
//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: "image",
//     });
//     return result;
//   } catch (error) {
//     console.error("Error deleting course image:", error);
//     return null;
//   }
// }
// export async function cloudinaryDeleteVideoFile(VideoUrl: string) {
//   if (!VideoUrl) {
//     return null;
//   }
//   const publicId = `VideoFiles/${extractPublicIdFromUrl(VideoUrl)}`;
//   if (!publicId) {
//     return null;
//   }
//   try {
//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: "video",
//     });
//     return result;
//   } catch (error) {
//     console.error("Error deleting course video:", error);
//     return null;
//   }
// }
// function extractPublicIdFromUrl(url: string): string | null {
//   const regex = /\/([^\/]+)\.(jpg|jpeg|png|gif|webp|tiff|bmp)$/;
//   const match = url.match(regex);
//   return match ? match[1] : null;
// }
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const streamifier_1 = __importDefault(require("streamifier"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function getPublicIdFromPath(cloudinaryPath) {
    const parts = cloudinaryPath.split('/');
    return parts[parts.length - 1]; // Returns the last part as public ID
}
const getSignedVideoUrl = (publicId) => {
    return cloudinary_1.v2.url(publicId, {
        resource_type: "video",
        type: "upload",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins expiry
    });
};
exports.getSignedVideoUrl = getSignedVideoUrl;
// Common upload function for streams
async function uploadToCloudinaryStream(fileBuffer, folder, resourceType) {
    if (!fileBuffer) {
        throw new Error("No file buffer provided for upload.");
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: resourceType, folder: folder }, (error, result) => {
            if (error) {
                console.error("Cloudinary upload error:", error.message);
                return reject(new Error("Failed to upload to Cloudinary. Please check the logs for more details."));
            }
            resolve({
                url: result?.secure_url,
                public_id: result?.public_id,
            });
        });
        // Create a stream from the uploaded file buffer and pipe it to Cloudinary
        streamifier_1.default.createReadStream(fileBuffer).pipe(stream);
    });
}
async function cloudinaryUploadUserImageFiles(fileBuffer) {
    return uploadToCloudinaryStream(fileBuffer, "userImages", "image");
}
async function cloudinaryUploadCourseImageFiles(fileBuffer) {
    return uploadToCloudinaryStream(fileBuffer, "courseImages", "image");
}
async function cloudinaryUploadVideoImageFiles(fileBuffer) {
    return uploadToCloudinaryStream(fileBuffer, "videoImages", "image");
}
async function cloudinaryUploadVideoFiles(fileBuffer) {
    return uploadToCloudinaryStream(fileBuffer, "VideoFiles", "video");
}
async function cloudinaryDeleteImage(imageUrl, folder) {
    if (!imageUrl) {
        throw new Error("No image URL provided for deletion.");
    }
    const publicId = `/${folder}/${extractPublicIdFromUrl(imageUrl)}`;
    if (!publicId) {
        throw new Error("Public ID could not be extracted.");
    }
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: "image",
        });
        return result;
    }
    catch (error) {
        console.error("Error deleting image:", error.message);
        throw new Error("Failed to delete image from Cloudinary. Please check the logs for more details.");
    }
}
async function cloudinaryDeleteUserImage(imageUrl) {
    return cloudinaryDeleteImage(imageUrl, "userImages");
}
async function cloudinaryDeleteCourseImage(imageUrl) {
    return cloudinaryDeleteImage(imageUrl, "courseImages");
}
async function cloudinaryDeleteVideoImage(imageUrl) {
    return cloudinaryDeleteImage(imageUrl, "videoImages");
}
async function cloudinaryDeleteVideoFile(videoUrl) {
    if (!videoUrl) {
        throw new Error("No video URL provided for deletion.");
    }
    const publicId = `/VideoFiles/${extractPublicIdFromUrl(videoUrl)}`;
    if (!publicId) {
        throw new Error("Public ID could not be extracted.");
    }
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: "video",
        });
        return result;
    }
    catch (error) {
        console.error("Error deleting video:", error.message);
        throw new Error("Failed to delete video from Cloudinary. Please check the logs for more details.");
    }
}
function extractPublicIdFromUrl(url) {
    const regex = /\/([^\/]+)(\.(jpg|jpeg|png|gif|webp|tiff|bmp|mp4|mov))?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
