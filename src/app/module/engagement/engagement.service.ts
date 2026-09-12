import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import config from '../../config';
import { JwtPayload } from '../../middlewares/auth.guard';
import { Bookkeeper } from '../bookkeeper/entities/bookkeeper.entity';
import { Businesswoner } from '../businesswoner/entities/businesswoner.entity';
import { MeetingSchedule } from '../meeting-schedule/entities/meeting-schedule.entity';
import { Request } from '../request/entities/request.entity';
import { User } from '../user/entities/user.entity';
import {
  CreateEngagementDto,
  SignEngagementDto,
} from './dto/create-engagement.dto';
import {
  Engagement,
  EngagementDocument,
  EngagementMessage,
} from './entities/engagement.entity';
export function calculateFee(projectValue: number) {
  if (
    !Number.isFinite(projectValue) ||
    projectValue < 5 ||
    projectValue > 9999999 ||
    Math.abs(projectValue * 100 - Math.round(projectValue * 100)) > 0.000001
  )
    throw new BadRequestException(
      'Project value must be USD 5–9,999,999 with at most two decimals',
    );
  const projectValueCents = Math.round(projectValue * 100);
  return {
    projectValueCents,
    platformFeeCents: Math.round(projectValueCents / 10),
  };
}
@Injectable()
export class EngagementService {
  private readonly stripe = config.stripe.secretKey
    ? new Stripe(config.stripe.secretKey)
    : undefined;
  constructor(
    @InjectModel(Engagement.name)
    private readonly engagements: Model<Engagement>,
    @InjectModel(MeetingSchedule.name)
    private readonly meetings: Model<MeetingSchedule>,
    @InjectModel(Request.name) private readonly requests: Model<Request>,
    @InjectModel(Businesswoner.name)
    private readonly businesses: Model<Businesswoner>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeepers: Model<Bookkeeper>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(EngagementMessage.name)
    private readonly messages: Model<EngagementMessage>,
  ) {}

  async create(dto: CreateEngagementDto, actor: JwtPayload) {
    if (actor.role !== 'admin') throw new ForbiddenException();
    if (dto.businessAgreed !== true || dto.bookkeeperAgreed !== true)
      throw new BadRequestException('Both parties must agree to proceed');

    const fee = calculateFee(dto.projectValue);
    const meeting = await this.meetings.findById(dto.meetingId);
    if (!meeting || meeting.status !== 'completed' || !meeting.completedAt)
      throw new BadRequestException('A completed pre-meeting is required');
    const request = await this.requests.findById(meeting.requestId);
    if (
      !request ||
      request.status !== 'accepted' ||
      String(request.businessId) !== String(meeting.businessId) ||
      String(request.bookkeeperId) !== String(meeting.bookkeeperId)
    )
      throw new BadRequestException(
        'Meeting must belong to the accepted request',
      );
    const business = await this.businesses.findById(request.businessId);
    const bookkeeper = await this.bookkeepers.findById(request.bookkeeperId);
    if (!business || !bookkeeper)
      throw new NotFoundException('Participant profile missing');
    try {
      return await this.engagements.create({
        meetingId: meeting._id,
        requestId: request._id,
        businessId: business.userId,
        bookkeeperId: bookkeeper.userId,
        createdBy: actor.id,
        projectTitle: dto.projectTitle,
        projectDetails: dto.projectDetails,
        contractText: dto.contractText,
        businessAgreed: true,
        bookkeeperAgreed: true,
        ...fee,
        status: 'contacted',
        paymentStatus: 'unpaid',
        contactUnlocked: false,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException(
          'Engagement already exists for this request',
        );
      throw error;
    }
  }

  async findOne(id: string, actor: JwtPayload): Promise<EngagementDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid engagement ID');
    const engagement = await this.engagements.findById(id);
    if (!engagement) throw new NotFoundException('Engagement not found');
    if (
      actor.role !== 'admin' &&
      ![
        String(engagement.businessId),
        String(engagement.bookkeeperId),
      ].includes(actor.id)
    )
      throw new ForbiddenException();
    return engagement;
  }
  findAll(actor: JwtPayload) {
    return this.engagements
      .find(
        actor.role === 'admin'
          ? {}
          : { $or: [{ businessId: actor.id }, { bookkeeperId: actor.id }] },
      )
      .sort({ createdAt: -1 })
      .limit(100);
  }
  async sign(id: string, actor: JwtPayload, dto: SignEngagementDto) {
    const engagement = await this.findOne(id, actor);
    if (dto.accepted !== true || !dto.signature.trim())
      throw new BadRequestException(
        'Contract acceptance and signature are required',
      );
    const isBookkeeper =
      actor.role === 'bookkeeper' &&
      String(engagement.bookkeeperId) === actor.id;
    const isBusiness =
      actor.role === 'business' && String(engagement.businessId) === actor.id;
    if (!isBookkeeper && !isBusiness) throw new ForbiddenException();
    const result = await this.engagements.findOneAndUpdate(
      { _id: id, status: isBookkeeper ? 'contacted' : 'bookkeeper_signed' },
      {
        $set: isBookkeeper
          ? {
              status: 'bookkeeper_signed',
              bookkeeperSignature: dto.signature.trim(),
              bookkeeperSignedAt: new Date(),
            }
          : {
              status: 'awaiting_payment',
              businessSignature: dto.signature.trim(),
              businessSignedAt: new Date(),
            },
      },
      { new: true },
    );
    if (!result)
      throw new ConflictException('Contract cannot be signed at this stage');
    return result;
  }

  async initiatePayment(id: string, actor: JwtPayload) {
    const engagement = await this.findOne(id, actor);
    if (actor.role !== 'business' || String(engagement.businessId) !== actor.id)
      throw new ForbiddenException();
    if (
      engagement.status !== 'awaiting_payment' ||
      !engagement.bookkeeperSignedAt ||
      !engagement.businessSignedAt ||
      engagement.paymentStatus === 'paid'
    )
      throw new ConflictException(
        'Both contracts must be signed before payment',
      );
    if (!this.stripe)
      throw new ServiceUnavailableException('Stripe is not configured');
    // One persisted intent per immutable engagement. Retries reuse it, including after failures.
    const intent = engagement.stripePaymentIntentId
      ? await this.stripe.paymentIntents.retrieve(
          engagement.stripePaymentIntentId,
        )
      : await this.stripe.paymentIntents.create(
          {
            amount: engagement.platformFeeCents,
            currency: engagement.currency,
            payment_method_types: ['card'],
            metadata: {
              engagementId: id,
              businessId: actor.id,
              paymentType: 'platform_fee',
            },
          },
          { idempotencyKey: 'engagement-fee-' + id },
        );
    await this.engagements.updateOne(
      { _id: id, status: 'awaiting_payment' },
      { $set: { stripePaymentIntentId: intent.id } },
    );
    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: engagement.platformFeeCents / 100,
      currency: engagement.currency,
    };
  }

  async confirmPayment(intent: Stripe.PaymentIntent) {
    const id = intent.metadata.engagementId;
    if (!id || !Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid engagement metadata');
    const engagement = await this.engagements.findById(id);
    if (!engagement || engagement.stripePaymentIntentId !== intent.id)
      throw new ConflictException(
        'Payment intent is not bound to engagement; retry webhook',
      );
    if (
      intent.status !== 'succeeded' ||
      intent.amount !== engagement.platformFeeCents ||
      intent.amount_received !== engagement.platformFeeCents ||
      intent.currency !== engagement.currency ||
      intent.metadata.businessId !== String(engagement.businessId) ||
      !engagement.bookkeeperSignedAt ||
      !engagement.businessSignedAt
    )
      throw new BadRequestException('Payment does not match signed engagement');
    if (engagement.status === 'active' && engagement.paymentStatus === 'paid')
      return;
    const result = await this.engagements.updateOne(
      {
        _id: id,
        status: 'awaiting_payment',
        paymentStatus: 'unpaid',
        stripePaymentIntentId: intent.id,
      },
      {
        $set: {
          status: 'active',
          paymentStatus: 'paid',
          contactUnlocked: true,
          paidAt: new Date(),
        },
      },
    );
    if (!result.modifiedCount)
      throw new ConflictException('Engagement cannot be activated');
  }

  private async requireActive(id: string, actor: JwtPayload) {
    const engagement = await this.findOne(id, actor);
    if (!['business', 'bookkeeper'].includes(actor.role))
      throw new ForbiddenException();
    if (
      engagement.status !== 'active' ||
      engagement.paymentStatus !== 'paid' ||
      !engagement.contactUnlocked
    )
      throw new ForbiddenException(
        'Payment must complete before contact or messaging access',
      );
    return engagement;
  }

  async contacts(id: string, actor: JwtPayload) {
    const engagement = await this.requireActive(id, actor);
    const otherId =
      String(engagement.businessId) === actor.id
        ? engagement.bookkeeperId
        : engagement.businessId;
    const user = await this.users
      .findById(otherId)
      .select('firstName lastName email phoneNumber');
    const profile =
      String(engagement.businessId) === actor.id
        ? await this.bookkeepers
            .findOne({ userId: otherId })
            .select('email phoneNumber')
        : await this.businesses
            .findOne({ userId: otherId })
            .select('businessEmail businessPhoneNumber');
    return { user, profile };
  }

  async sendMessage(id: string, actor: JwtPayload, text: string) {
    await this.requireActive(id, actor);
    if (!text.trim() || text.length > 5000)
      throw new BadRequestException('Message must contain 1–5000 characters');
    return this.messages.create({
      engagementId: id,
      senderId: actor.id,
      text: text.trim(),
    });
  }

  async listMessages(id: string, actor: JwtPayload, before?: string) {
    await this.requireActive(id, actor);
    if (before && !Types.ObjectId.isValid(before))
      throw new BadRequestException('Invalid cursor');
    return this.messages
      .find({
        engagementId: id,
        ...(before ? { _id: { $lt: new Types.ObjectId(before) } } : {}),
      })
      .sort({ _id: -1 })
      .limit(50);
  }
}
