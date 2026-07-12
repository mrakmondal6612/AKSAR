import mongoose, { Document } from 'mongoose';

export interface INotification extends Document {
    user: string;
    todo?: string;
    course?: string;
    type:
    // Existing types
        | 'todo_overdue'
        | 'todo_due_soon'
        | 'course_start'
        | 'course_end'
        | 'deadline_approaching'
        // Student notifications
        | 'course_enrolled'
        | 'new_video_added'
        | 'course_updated'
        | 'test_available'
        | 'certificate_earned'
        | 'instructor_request_approved'
        | 'instructor_request_rejected'
        // Instructor notifications
        | 'new_enrollment'
        | 'course_rated'
        // Admin notifications
        | 'new_instructor_request'
        | 'new_contact_message'
        // General
        | 'admin_announcement';
    title: string;
    message: string;
    read: boolean;
    readAt?: Date;
    link?: string;
}

const notificationSchema = new mongoose.Schema<INotification>(
    {
        user: { type: String, ref: 'User', required: true },
        todo: { type: String, ref: 'Todo' },
        course: { type: String, ref: 'Course' },
        type: {
            type: String,
            enum: [
                'todo_overdue',
                'todo_due_soon',
                'course_start',
                'course_end',
                'deadline_approaching',
                'course_enrolled',
                'new_video_added',
                'course_updated',
                'test_available',
                'certificate_earned',
                'instructor_request_approved',
                'instructor_request_rejected',
                'new_enrollment',
                'course_rated',
                'new_instructor_request',
                'new_contact_message',
                'admin_announcement',
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        readAt: { type: Date },
        link: { type: String },
    },
    { timestamps: true }
);

const Notification =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;