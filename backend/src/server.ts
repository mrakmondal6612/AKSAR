import express, { Response, Request } from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB from "./utils/db.config";
import userRoute from "./routes/user.route";
import courseRoute from "./routes/course.route";
import videoRoute from "./routes/video.route";
import { startNotificationScheduler } from "./services/notificationJob.service";
import { startRecurringTodoScheduler } from "./services/recurringTodoJob.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

//CORS middleware
app.use(cors({
    origin: process.env.PUBLIC_FRONTEND_DOMAIN || "http://localhost:5173",
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(passport.initialize());

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to AKSAR Backend on port " + PORT);
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/video", videoRoute);

async function startServer() {
    try {
        await connectDB();
        startNotificationScheduler();
        startRecurringTodoScheduler();
        app.listen(PORT, () => {
            console.log("Server started on port: " + PORT);
        });
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

startServer();

process.on("SIGINT", () => {
    console.log("Server is shutting down...");
    process.exit();
});

export default app;
