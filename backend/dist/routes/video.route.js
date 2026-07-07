"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVideo = exports.upload = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
// import { upload, uploadVideo } from "../middleware/multer.middleware";
const multer_1 = __importDefault(require("multer"));
const uploadVideo_controllers_1 = require("../controllers/video/uploadVideo.controllers");
const getVideo_controllers_1 = require("../controllers/video/getVideo.controllers");
const deleteVideo_controllers_1 = require("../controllers/video/deleteVideo.controllers");
const updateVideo_controllers_1 = require("../controllers/video/updateVideo.controllers");
const streamVideo_controllers_1 = require("../controllers/video/streamVideo.controllers");
const path_1 = __importDefault(require("path"));
const videoRoute = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const videoFileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ext === '.mp4' && file.mimetype === 'video/mp4') {
        cb(null, true); // Accept the file
    }
    else {
        cb(new Error('Only MP4 videos are allowed!'));
    }
};
// Export the video upload middleware
exports.upload = (0, multer_1.default)({ storage });
exports.uploadVideo = (0, multer_1.default)({ storage, fileFilter: videoFileFilter });
videoRoute.get("/get-videos", getVideo_controllers_1.handleGetAllVideosOfCourse);
videoRoute.get("/get-video-by-id", getVideo_controllers_1.handleGetVideoDataById);
videoRoute.post("/add-video/youtube", auth_middleware_1.authenticateAdminToken, exports.upload.single('youtubeVideoImage'), uploadVideo_controllers_1.handleAddNewYoutubeVideoFunction);
videoRoute.post("/add-video/personal", auth_middleware_1.authenticateAdminToken, exports.upload.single('personalVideoImage'), uploadVideo_controllers_1.handleAddNewPersonalVideoFunction);
videoRoute.post("/upload-video/personal", auth_middleware_1.authenticateAdminToken, exports.uploadVideo.single('personalVideoFile'), uploadVideo_controllers_1.handleUploadPersonalVideoFunction);
videoRoute.put("/update-video/youtube", auth_middleware_1.authenticateAdminToken, exports.upload.single('youtubeVideoImage'), updateVideo_controllers_1.handleUpdateYoutubeVideoFunction);
videoRoute.put("/update-video/personal", auth_middleware_1.authenticateAdminToken, exports.upload.single('personalVideoImage'), updateVideo_controllers_1.handleUpdatePersonalVideoFunction);
videoRoute.post("/delete-video", auth_middleware_1.authenticateAdminToken, deleteVideo_controllers_1.handleDeleteVideoFunction);
videoRoute.get("/stream-video/:publicId", streamVideo_controllers_1.handleVideoStreamingFunction);
exports.default = videoRoute;
