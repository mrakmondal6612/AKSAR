"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Marksheet_model_1 = __importDefault(require("./models/Marksheet.model"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../.env") });
const run = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is not defined");
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    console.log("Connected to MongoDB");
    const marksheets = await Marksheet_model_1.default.find({});
    console.log(`Found ${marksheets.length} marksheets:`);
    for (const m of marksheets) {
        console.log(`- ID: ${m._id}, marksheetId: "${m.marksheetId}", passed: ${m.passed}, status: ${m.certificateStatus}`);
    }
    await mongoose_1.default.disconnect();
};
run().catch(console.error);
