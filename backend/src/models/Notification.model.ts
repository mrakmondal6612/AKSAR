import mongoose, { Document } from 'mongoose';

export interface INotification extends Document {
  user: string;
  todo?: string;
  course?: string;
  type: 'todo_overdue' | 'todo_due_soon' | 'course_start' | 'course_end' | 'deadline_approaching';
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: { type: String, ref: 'User', required: true },
    todo: { type: String, ref: 'Todo' },
    course: { type: String, ref: 'Course' },
    type: {
      type: String,
      enum: ['todo_overdue', 'todo_due_soon', 'course_start', 'course_end', 'deadline_approaching'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
