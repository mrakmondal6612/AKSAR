"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const contactMessageSchema = new mongoose_1.default.Schema({
    messageId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });
const ContactMessage = mongoose_1.default.models.ContactMessage ||
    mongoose_1.default.model("ContactMessage", contactMessageSchema);
exports.default = ContactMessage;
