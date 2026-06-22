"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const db_config_1 = __importDefault(require("./utils/db.config"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const video_route_1 = __importDefault(require("./routes/video.route"));
const notificationJob_service_1 = require("./services/notificationJob.service");
const recurringTodoJob_service_1 = require("./services/recurringTodoJob.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
//CORS middleware
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.get("/", (req, res) => {
    res.send("Welcome to AKSAR Backend on port " + PORT);
});
app.use("/api/v1/user", user_route_1.default);
app.use("/api/v1/course", course_route_1.default);
app.use("/api/v1/video", video_route_1.default);
async function startServer() {
    try {
        await (0, db_config_1.default)();
        const server = app.listen(PORT, () => {
            console.log("Server started on port: " + PORT);
            (0, notificationJob_service_1.startNotificationScheduler)();
            (0, recurringTodoJob_service_1.startRecurringTodoScheduler)();
        });
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Stop the process using it ` +
                    `or set a different PORT in your environment, then restart.`);
            }
            else {
                console.error("Server error:", error);
            }
            process.exit(1);
        });
        const shutdown = (signal) => {
            console.log(`${signal} received, server is shutting down...`);
            server.close(() => process.exit(0));
        };
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    }
    catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
