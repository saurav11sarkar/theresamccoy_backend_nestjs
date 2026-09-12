import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MeetingScheduleDocument = HydratedDocument<MeetingSchedule>;

@Schema({ timestamps: true })
export class MeetingSchedule {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  })
  requestId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookkeeper',
    required: true,
  })
  bookkeeperId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Businesswoner',
    required: true,
  })
  businessId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true })
  time!: string;

  @Prop({ type: String, required: true })
  meetingLink!: string;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop()
  meetingNote?: string;

  @Prop({
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status!: string;
}

export const MeetingScheduleSchema =
  SchemaFactory.createForClass(MeetingSchedule);
