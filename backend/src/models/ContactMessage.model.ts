import mongoose, { Document } from "mongoose";

export interface IContactMessage extends Document {
    messageId: string;
    email: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

const contactMessageSchema = new mongoose.Schema<IContactMessage>(
    {
        messageId: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const ContactMessage =
    mongoose.models.ContactMessage ||
    mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);

export default ContactMessage;