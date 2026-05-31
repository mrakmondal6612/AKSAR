import mongoose, { Document } from 'mongoose';

export interface ISubtask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ITimeSession {
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  note?: string;
}

export interface IRecurrence {
  enabled: boolean;
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // for monthly
  endDate?: Date;
  nextDueDate?: Date;
  createdFromParent?: string; // parent recurring todo ID
}

export interface ITodo extends Document {
  user: string;
  text: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  priorityRank: number; // for ordering
  dueDate?: Date;
  category?: string;
  subtasks: ISubtask[];
  courseId?: string;
  notificationEnabled: boolean;
  completedAt?: Date;
  tags: string[];
  
  // Recurring features
  recurrence?: IRecurrence;
  
  // Time tracking
  estimatedTime?: number; // in minutes
  timeSessions: ITimeSession[];
  timeSpent?: number; // total in minutes
  
  // Advanced features
  attachments?: string[]; // file URLs
  comments?: Array<{ user: string; text: string; createdAt: Date }>;
  collaborators?: string[];
  
  // Audit trail
  history?: Array<{ action: string; timestamp: Date; changedBy: string; oldValue?: any; newValue?: any }>;
}

const subtaskSchema = new mongoose.Schema<ISubtask>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const timeSessionSchema = new mongoose.Schema<ITimeSession>(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, required: true }, // minutes
    note: { type: String },
  },
  { _id: false }
);

const recurrenceSchema = new mongoose.Schema<IRecurrence>(
  {
    enabled: { type: Boolean, default: false },
    pattern: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'], default: 'daily' },
    interval: { type: Number, default: 1 },
    daysOfWeek: [Number],
    dayOfMonth: Number,
    endDate: Date,
    nextDueDate: Date,
    createdFromParent: String,
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    changedBy: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const todoSchema = new mongoose.Schema<ITodo>(
  {
    user: { type: String, ref: 'User', required: true },
    text: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    priorityRank: { type: Number, default: 0 },
    dueDate: { type: Date },
    category: { type: String },
    subtasks: [subtaskSchema],
    courseId: { type: String, ref: 'Course' },
    notificationEnabled: { type: Boolean, default: false },
    completedAt: { type: Date },
    tags: [String],
    
    // Recurring
    recurrence: recurrenceSchema,
    
    // Time tracking
    estimatedTime: { type: Number }, // minutes
    timeSessions: [timeSessionSchema],
    timeSpent: { type: Number, default: 0 }, // minutes
    
    // Advanced
    attachments: [String],
    comments: [commentSchema],
    collaborators: [String],
    history: [historySchema],
  },
  { timestamps: true }
);

// Index for efficient querying
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, completed: 1, priority: 1 });
todoSchema.index({ 'recurrence.enabled': 1, 'recurrence.nextDueDate': 1 });

const Todo = mongoose.models.Todo || mongoose.model<ITodo>('Todo', todoSchema);

export default Todo;

