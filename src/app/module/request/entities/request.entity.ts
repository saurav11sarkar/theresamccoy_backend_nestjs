import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RequestDocument = HydratedDocument<Request>;

@Schema({ timestamps: true })
export class Request {
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

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status!: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);

RequestSchema.index(
  { businessId: 1, bookkeeperId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
  },
);
