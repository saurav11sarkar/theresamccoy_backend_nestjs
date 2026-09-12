import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import {
  Engagement,
  EngagementSchema,
  EngagementMessage,
  EngagementMessageSchema,
} from './entities/engagement.entity';
import {
  MeetingSchedule,
  MeetingScheduleSchema,
} from '../meeting-schedule/entities/meeting-schedule.entity';
import { Request, RequestSchema } from '../request/entities/request.entity';
import {
  Businesswoner,
  BusinesswonerSchema,
} from '../businesswoner/entities/businesswoner.entity';
import {
  Bookkeeper,
  BookkeeperSchema,
} from '../bookkeeper/entities/bookkeeper.entity';
import { User, UserSchema } from '../user/entities/user.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Engagement.name, schema: EngagementSchema },
      { name: EngagementMessage.name, schema: EngagementMessageSchema },
      { name: MeetingSchedule.name, schema: MeetingScheduleSchema },
      { name: Request.name, schema: RequestSchema },
      { name: Businesswoner.name, schema: BusinesswonerSchema },
      { name: Bookkeeper.name, schema: BookkeeperSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
