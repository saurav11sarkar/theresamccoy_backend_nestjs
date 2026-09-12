import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerDocument,
} from '../businesswoner/entities/businesswoner.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { Request, RequestDocument } from './entities/request.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
  ) {}

  async createRequest(businessId: string, bookkeeperId: string) {
    const businessWoner = await this.businesswonerModel.findOne({
      userId: businessId,
    });
    if (!businessWoner) {
      throw new HttpException('Business owner not found', HttpStatus.NOT_FOUND);
    }
    const bookkeeper = await this.bookkeeperModel.findById(bookkeeperId);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const bookkeperUser = await this.userModel.findById(bookkeeper.userId);
    if (!bookkeperUser) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const duplicate = await this.requestModel.exists({
      businessId: businessWoner._id,
      bookkeeperId: bookkeeper._id,
      status: { $in: ['pending', 'accepted'] },
    });
    if (duplicate)
      throw new HttpException('An active request already exists', 409);
    const request = await this.requestModel.create({
      bookkeeperId: bookkeeper._id,
      businessId: businessWoner._id,
      status: 'pending',
    });
    return request;
  }

  async getAllRequest(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(params, ['status']);
    const request = await this.requestModel
      .find(whenConditions)
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
    const total = await this.requestModel.countDocuments(whenConditions);
    return {
      data: request,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getRequest(requestId: string) {
    const populate = [
      {
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      },
      {
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      },
    ];
    const result = await this.requestModel
      .findById(requestId)
      .populate(populate);
    return result;
  }

  async getMyRequests(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const isBookkeeper = await this.bookkeeperModel.findOne({
      userId: userId,
    });
    const isBusinessOwner = await this.businesswonerModel.findOne({
      userId: userId,
    });

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
      ['status'],
      extraConditions,
    );
    const request = await this.requestModel
      .find(whenConditions)
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
    const total = await this.requestModel.countDocuments(whenConditions);
    return {
      data: request,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async acceptRequest(requestId: string, userId: string) {
    return this.respond(requestId, userId, 'accepted');
  }
  async rejectRequest(requestId: string, userId: string) {
    return this.respond(requestId, userId, 'rejected');
  }
  private async respond(requestId: string, userId: string, status: string) {
    const bookkeeper = await this.bookkeeperModel.findOne({ userId });
    if (!bookkeeper) throw new HttpException('Bookkeeper not found', 404);
    const request = await this.requestModel.findOneAndUpdate(
      { _id: requestId, bookkeeperId: bookkeeper._id, status: 'pending' },
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!request)
      throw new HttpException(
        'Only the assigned bookkeeper can respond to a pending request',
        409,
      );
    return request;
  }
}
