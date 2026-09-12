import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateMeetingScheduleDto } from './dto/create-meeting-schedule.dto';
import { ChangeMeetingStatusDto } from './dto/change-meeting-status.dto';
import { MeetingScheduleService } from './meeting-schedule.service';

@ApiTags('meeting-schedule')
@Controller('meeting-schedule')
export class MeetingScheduleController {
  constructor(
    private readonly meetingScheduleService: MeetingScheduleService,
  ) {}

  @Post(':requestId')
  @ApiOperation({ summary: 'Schedule a meeting for a request (Admin only)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async scheduleMeeting(
    @Param('requestId') requestId: string,
    @Body() createMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const result = await this.meetingScheduleService.scheduleMeeting(
      requestId,
      createMeetingScheduleDto,
    );
    return {
      message: 'Meeting scheduled successfully',
      data: result,
    };
  }

  @Get('my-schedules')
  @ApiOperation({ summary: 'Get meeting schedules for logged-in user' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getMyMeetingSchedules(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.meetingScheduleService.getMyMeetingSchedules(
      req.user!.id,
      filters,
      options,
    );
    return {
      message: 'My meeting schedules fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all meeting schedules (Admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllMeetingSchedules(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'status']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.meetingScheduleService.getAllMeetingSchedules(
      filters,
      options,
    );
    return {
      message: 'Meeting schedules fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting schedule by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getMeetingScheduleById(@Param('id') id: string) {
    const result = await this.meetingScheduleService.getMeetingScheduleById(id);
    return {
      message: 'Meeting schedule fetched successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update meeting schedule by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateMeetingSchedule(
    @Param('id') id: string,
    @Body() updateMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const result = await this.meetingScheduleService.updateMeetingSchedule(
      id,
      updateMeetingScheduleDto,
    );
    return {
      message: 'Meeting schedule updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete meeting schedule by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteMeetingSchedule(@Param('id') id: string) {
    const result = await this.meetingScheduleService.deleteMeetingSchedule(id);
    return {
      message: 'Meeting schedule deleted successfully',
      data: result,
    };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change meeting status (Admin or meeting participant)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async changeMeetingStatus(
    @Param('id') id: string,
    @Body() dto: ChangeMeetingStatusDto,
    @Req() req: Request,
  ) {
    const result = await this.meetingScheduleService.changeMeetingStatus(
      id,
      dto.status,
      req.user!,
    );
    return {
      message: 'Meeting schedule status changed successfully',
      data: result,
    };
  }
}
