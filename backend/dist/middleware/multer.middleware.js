"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadVideo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Storage for images
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, path.join(__dirname, "../cloud/images"));
        cb(null, process.env.CLOUDINARY_IMAGE_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const storageVideo = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, path.join(__dirname, '../cloud/videos')); // Video directory
        cb(null, process.env.CLOUDINARY_VIDEO_PATH); // Video directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, `${file.fieldname}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
// Video file filter to allow only MP4 files
const videoFileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ext === '.mp4' && file.mimetype === 'video/mp4') {
        cb(null, true); // Accept the file
    }
    else {
        cb(new Error('Only MP4 videos are allowed!')); // Reject other files
    }
};
// Export the video upload middleware
exports.uploadVideo = (0, multer_1.default)({
    storage: storageVideo,
    fileFilter: videoFileFilter,
});
exports.upload = (0, multer_1.default)({ storage });
