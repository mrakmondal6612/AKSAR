import mongoose, { Document } from 'mongoose';

export interface ICourseEnrollment extends Document {
  user: string;
  course: string;
  enrollmentDate: Date;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
}

const courseEnrollmentSchema = new mongoose.Schema<ICourseEnrollment>(
  {
    user: { type: String, ref: 'User', required: true },
    course: { type: String, ref: 'Course', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

const CourseEnrollment =
  mongoose.models.CourseEnrollment ||
  mongoose.model<ICourseEnrollment>('CourseEnrollment', courseEnrollmentSchema);

export default CourseEnrollment;
