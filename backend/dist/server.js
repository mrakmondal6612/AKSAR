"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_config_1 = __importDefault(require("./utils/db.config"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const video_route_1 = __importDefault(require("./routes/video.route"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8081;
//CORS middleware
app.use((0, cors_1.default)({
    origin: process.env.PUBLIC_FRONTEND_DOMAIN || "http://localhost:5173",
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Welcome to AKSAR Backend on port " + PORT);
});
app.use("/api/v1/user", user_route_1.default);
app.use("/api/v1/course", course_route_1.default);
app.use("/api/v1/video", video_route_1.default);
async function startServer() {
    try {
        await (0, db_config_1.default)();
        app.listen(PORT, () => {
            console.log("Server started on port: " + PORT);
        });
    }
    catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}
startServer();
process.on("SIGINT", () => {
    console.log("Server is shutting down...");
    process.exit();
});
exports.default = app;
