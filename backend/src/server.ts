import express, { Response, Request } from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB from "./utils/db.config";
import userRoute from "./routes/user.route";
import courseRoute from "./routes/course.route";
import videoRoute from "./routes/video.route";
import testRoute from "./routes/test.route";
import { startNotificationScheduler } from "./services/notificationJob.service";
import { startRecurringTodoScheduler } from "./services/recurringTodoJob.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

//CORS middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
}));
app.options("*", cors());
app.use(express.json());
app.use(passport.initialize());

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to AKSAR Backend on port " + PORT);
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/video", videoRoute);
app.use("/api/v1/test", testRoute);

async function startServer() {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log("Server started on port: " + PORT);
            startNotificationScheduler();
            startRecurringTodoScheduler();
        });

        server.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "EADDRINUSE") {
                console.error(
                    `Port ${PORT} is already in use. Stop the process using it ` +
                    `or set a different PORT in your environment, then restart.`
                );
            } else {
                console.error("Server error:", error);
            }
            process.exit(1);
        });

        const shutdown = (signal: string) => {
            console.log(`${signal} received, server is shutting down...`);
            server.close(() => process.exit(0));
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

startServer();

export default app;
