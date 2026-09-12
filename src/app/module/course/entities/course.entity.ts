import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;
export type ModuleDocument = HydratedDocument<Module>;
export type LessonDocument = HydratedDocument<Lesson>;
export type QuizDocument = HydratedDocument<Quiz>;
export type CourseProgressDocument = HydratedDocument<CourseProgress>;
export type CourseEnrollmentDocument = HydratedDocument<CourseEnrollment>;
export type AssignmentSubmissionDocument =
  HydratedDocument<AssignmentSubmission>;
// export type QuizOptionDocument = HydratedDocument<QuizOption>;

// @Schema({ _id: true })
// export class QuizOption {
//   @Prop({ required: true })
//   option!: string;

//   @Prop()
//   answer?: string;

//   // @Prop()
//   // image?: string;
// }

@Schema({ _id: true })
export class Quiz {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  question!: string;

  @Prop({ type: [String], default: [] })
  options!: string[];

  @Prop({ required: true })
  answer!: string;
}

@Schema({ _id: true })
export class Lesson {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 0 })
  durationMinutes!: number;

  @Prop()
  video?: string;

  @Prop()
  resource?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: [Quiz], default: [] })
  quizzes!: Quiz[];

  @Prop({ trim: true })
  assignmentTitle?: string;

  @Prop({ trim: true })
  assignmentInstructions?: string;

  @Prop()
  assignmentDueDate?: Date;
}

@Schema({ _id: true })
export class Module {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: [Lesson], default: [] })
  lessons!: Lesson[];
}

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 0 })
  price!: number;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  level!: string;

  @Prop({ enum: ['draft', 'published'], default: 'draft' })
  status!: string;

  @Prop()
  instructor?: string;

  @Prop()
  photo?: string;

  @Prop({ type: [Module], default: [] })
  modules!: Module[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
export const ModuleSchema = SchemaFactory.createForClass(Module);
export const LessonSchema = SchemaFactory.createForClass(Lesson);
export const QuizSchema = SchemaFactory.createForClass(Quiz);

@Schema({ timestamps: true })
export class CourseEnrollment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;
}

export const CourseEnrollmentSchema =
  SchemaFactory.createForClass(CourseEnrollment);

@Schema({ timestamps: true })
export class CourseProgress {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], default: [] })
  completedLessonIds!: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  currentLessonId?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class AssignmentSubmission {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  lessonId!: Types.ObjectId;

  @Prop({ required: true })
  file!: string;

  @Prop({ enum: ['submitted', 'reviewed'], default: 'submitted' })
  status!: string;
}

export const CourseProgressSchema =
  SchemaFactory.createForClass(CourseProgress);
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const AssignmentSubmissionSchema =
  SchemaFactory.createForClass(AssignmentSubmission);
AssignmentSubmissionSchema.index(
  { userId: 1, courseId: 1, lessonId: 1 },
  { unique: true },
);
// export const QuizOptionSchema = SchemaFactory.createForClass(QuizOption);
