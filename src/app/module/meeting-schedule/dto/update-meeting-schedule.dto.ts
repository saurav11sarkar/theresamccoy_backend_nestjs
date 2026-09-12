import { PartialType } from '@nestjs/swagger';
import { CreateMeetingScheduleDto } from './create-meeting-schedule.dto';

export class UpdateMeetingScheduleDto extends PartialType(
  CreateMeetingScheduleDto,
) {}
