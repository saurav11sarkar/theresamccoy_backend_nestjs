import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMeetingScheduleDto {
  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: '12:00 PM' })
  @IsString()
  @IsNotEmpty()
  time!: string;

  @ApiProperty({ example: 'https://meet.google.com/abc-def-ghi' })
  @IsString()
  @IsNotEmpty()
  meetingLink!: string;

  @ApiProperty({ example: 'Meeting note', required: false })
  @IsString()
  @IsOptional()
  meetingNote?: string;
}
