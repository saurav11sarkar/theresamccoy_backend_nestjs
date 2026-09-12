import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type EngagementDocument = HydratedDocument<Engagement>;
@Schema({ timestamps: true })
export class Engagement {
  @Prop({ type: Types.ObjectId, ref: 'Request', required: true, unique: true })
  requestId!: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: 'MeetingSchedule',
    required: true,
    unique: true,
  })
  meetingId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bookkeeperId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop()
  projectTitle!: string;

  @Prop({ required: true })
  projectDetails!: string;

  @Prop()
  contractText!: string;

  @Prop()
  projectValueCents!: number;

  @Prop()
  platformFeeCents!: number;

  @Prop({ default: 'usd', enum: ['usd'] })
  currency!: string;

  @Prop({
    default: 'contacted',
    enum: ['contacted', 'bookkeeper_signed', 'awaiting_payment', 'active'],
  })
  status!: string;

  @Prop({ default: 'unpaid', enum: ['unpaid', 'paid'] })
  paymentStatus!: string;

  @Prop({ default: false })
  contactUnlocked!: boolean;

  @Prop({ required: true })
  businessAgreed!: boolean;

  @Prop({ required: true })
  bookkeeperAgreed!: boolean;

  @Prop()
  bookkeeperSignature?: string;

  @Prop()
  businessSignature?: string;

  @Prop({ type: Date })
  bookkeeperSignedAt?: Date;

  @Prop({ type: Date })
  businessSignedAt?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ unique: true, sparse: true })
  stripePaymentIntentId?: string;
}
export const EngagementSchema = SchemaFactory.createForClass(Engagement);
@Schema({ timestamps: true })
export class EngagementMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'Engagement',
    required: true,
    index: true,
  })
  engagementId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 5000 })
  text!: string;
}
export const EngagementMessageSchema =
  SchemaFactory.createForClass(EngagementMessage);
