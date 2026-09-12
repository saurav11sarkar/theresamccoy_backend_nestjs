import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Bookkeeper,
  BookkeeperSchema,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerSchema,
} from '../businesswoner/entities/businesswoner.entity';
import { Request, RequestSchema } from '../request/entities/request.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  MeetingSchedule,
  MeetingScheduleSchema,
} from './entities/meeting-schedule.entity';
import { MeetingScheduleController } from './meeting-schedule.controller';
import { MeetingScheduleService } from './meeting-schedule.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingSchedule.name, schema: MeetingScheduleSchema },
      { name: Request.name, schema: RequestSchema },
      { name: User.name, schema: UserSchema },
      { name: Businesswoner.name, schema: BusinesswonerSchema },
      { name: Bookkeeper.name, schema: BookkeeperSchema },
    ]),
  ],
  controllers: [MeetingScheduleController],
  providers: [MeetingScheduleService],
  exports: [MeetingScheduleService],
})
export class MeetingScheduleModule {}
