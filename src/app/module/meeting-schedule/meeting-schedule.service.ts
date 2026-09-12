import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import type { JwtPayload } from '../../middlewares/auth.guard';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerDocument,
} from '../businesswoner/entities/businesswoner.entity';
import { Request, RequestDocument } from '../request/entities/request.entity';
import { CreateMeetingScheduleDto } from './dto/create-meeting-schedule.dto';
import {
  MeetingSchedule,
  MeetingScheduleDocument,
} from './entities/meeting-schedule.entity';

@Injectable()
export class MeetingScheduleService {
  constructor(
    @InjectModel(MeetingSchedule.name)
    private readonly meetingScheduleModel: Model<MeetingScheduleDocument>,
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
  ) {}

  async scheduleMeeting(
    requestId: string,
    createMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }

    if (request.status !== 'accepted') {
      throw new HttpException(
        'Only accepted requests can have a meeting',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingMeeting = await this.meetingScheduleModel.findOne({
      requestId: request._id,
      status: { $in: ['pending', 'scheduled'] },
    });
    if (existingMeeting) {
      throw new HttpException(
        'A meeting is already scheduled for this request',
        HttpStatus.BAD_REQUEST,
      );
    }

    const meetingSchedule = await this.meetingScheduleModel.create({
      requestId: request._id,
      bookkeeperId: request.bookkeeperId,
      businessId: request.businessId,
      date: createMeetingScheduleDto.date,
      time: createMeetingScheduleDto.time,
      meetingLink: createMeetingScheduleDto.meetingLink,
      meetingNote: createMeetingScheduleDto.meetingNote,
      status: 'scheduled',
    });

    return meetingSchedule;
  }

  async getAllMeetingSchedules(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(params, [
      'status',
      'meetingNote',
    ]);
    const schedules = await this.meetingScheduleModel
      .find(whenConditions)
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    return {
      data: schedules,
      meta: {
        page,
        limit,
      },
    };
  }

  async getMyMeetingSchedules(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const isBookkeeper = await this.bookkeeperModel.findOne({ userId });
    const isBusinessOwner = await this.businesswonerModel.findOne({ userId });

    if (!isBookkeeper && !isBusinessOwner) {
      throw new HttpException(
        'Bookkeeper or Business Owner profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const extraConditions: Record<string, any> = {};

    if (isBookkeeper && isBusinessOwner) {
      extraConditions.$or = [
        { bookkeeperId: isBookkeeper._id },
        { businessId: isBusinessOwner._id },
      ];
    } else if (isBookkeeper) {
      extraConditions.bookkeeperId = isBookkeeper._id;
    } else if (isBusinessOwner) {
      extraConditions.businessId = isBusinessOwner._id;
    }

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(
      params,
      ['status', 'meetingNote'],
      extraConditions,
    );

    const schedules = await this.meetingScheduleModel
      .find(whenConditions)
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total =
      await this.meetingScheduleModel.countDocuments(whenConditions);
    return {
      data: schedules,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getMeetingScheduleById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
    }

    const result = await this.meetingScheduleModel
      .findOne({
        $or: [{ _id: id }, { requestId: id }],
      })
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',

        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      });

    if (!result) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  async updateMeetingSchedule(
    id: string,
    updateMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (meetingSchedule.status !== 'scheduled')
      throw new HttpException('Only scheduled meetings can be edited', 409);
    const updatedSchedule = await this.meetingScheduleModel.findOneAndUpdate(
      { _id: meetingSchedule._id, status: 'scheduled' },
      {
        date: updateMeetingScheduleDto.date,
        time: updateMeetingScheduleDto.time,
        meetingLink: updateMeetingScheduleDto.meetingLink,
        meetingNote: updateMeetingScheduleDto.meetingNote,
      },
      { new: true },
    );
    if (!updatedSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedSchedule;
  }

  async deleteMeetingSchedule(id: string) {
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (meetingSchedule.status === 'completed')
      throw new HttpException('Completed meetings cannot be deleted', 409);
    const deletedSchedule = await this.meetingScheduleModel.findOneAndDelete({
      _id: meetingSchedule._id,
      status: { $ne: 'completed' },
    });
    if (!deletedSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return deletedSchedule;
  }

  async changeMeetingStatus(
    id: string,
    status: string,
    user: Pick<JwtPayload, 'id' | 'role'>,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
    }
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (user.role !== 'admin') {
      const profile =
        user.role === 'business'
          ? await this.businesswonerModel.findOne({ userId: user.id })
          : user.role === 'bookkeeper'
            ? await this.bookkeeperModel.findOne({ userId: user.id })
            : null;
      const participantId =
        user.role === 'business'
          ? meetingSchedule.businessId
          : meetingSchedule.bookkeeperId;
      if (!profile || String(profile._id) !== String(participantId)) {
        throw new HttpException(
          'You can only change the status of your own meetings',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    if (!['completed', 'cancelled'].includes(status))
      throw new HttpException('Invalid meeting transition', 400);
    const request = await this.requestModel.findById(meetingSchedule.requestId);
    if (request?.status !== 'accepted')
      throw new HttpException('Request must be accepted', 400);
    if (meetingSchedule.status !== 'scheduled') {
      throw new HttpException(
        'Only scheduled meetings can change status',
        HttpStatus.CONFLICT,
      );
    }
    const updatedSchedule = await this.meetingScheduleModel.findOneAndUpdate(
      { _id: meetingSchedule._id, status: 'scheduled' },
      {
        $set: {
          status,
          completedAt: status === 'completed' ? new Date() : null,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedSchedule) {
      throw new HttpException(
        'Meeting status has changed; refresh and try again',
        HttpStatus.CONFLICT,
      );
    }
    return updatedSchedule;
  }
}
