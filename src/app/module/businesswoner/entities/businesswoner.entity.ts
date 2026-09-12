import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BusinesswonerDocument = HydratedDocument<Businesswoner>;

export enum BusinesswonerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Businesswoner {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop()
  fullName!: string;

  @Prop()
  businessName!: string;

  @Prop()
  businessEmail!: string;

  @Prop()
  businessPhoneNumber!: string;

  @Prop()
  preferredLanguage!: string;

  @Prop()
  industry!: string;

  @Prop()
  entityType!: string;

  @Prop()
  yearsInBusiness!: number;

  @Prop()
  numberOfEmployees!: number;

  @Prop()
  businessLocation!: string;

  @Prop()
  website!: string;

  @Prop()
  supportType!: string;

  @Prop({ type: [String], default: [] })
  engagementTypes!: string[];

  @Prop()
  annualSales!: string;

  @Prop()
  onsiteOrVirtual!: string;

  @Prop({ type: [String], default: [] })
  whereDoYouStandToday!: string[];

  @Prop()
  currentSystem!: string;

  @Prop()
  monthlyTransactionVolume!: string;

  @Prop({ type: [String], default: [] })
  servicesYouAreLookingFor!: string[];

  @Prop({ type: [String], default: [] })
  interestedIn!: string[];

  @Prop()
  businessCoaching!: string;

  @Prop()
  monthlyBudgetRange!: string;

  @Prop()
  anythingElse!: string;

  @Prop({
    type: String,
    enum: BusinesswonerStatus,
    default: BusinesswonerStatus.PENDING,
    index: true,
  })
  status!: BusinesswonerStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  approvedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  approvedAt!: Date | null;
}

export const BusinesswonerSchema = SchemaFactory.createForClass(Businesswoner);
