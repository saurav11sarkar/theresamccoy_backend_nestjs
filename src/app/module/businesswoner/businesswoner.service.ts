import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateBusinesswonerDto } from './dto/create-businesswoner.dto';
import { UpdateBusinesswonerDto } from './dto/update-businesswoner.dto';
import {
  Businesswoner,
  BusinesswonerDocument,
  BusinesswonerStatus,
} from './entities/businesswoner.entity';

@Injectable()
export class BusinesswonerService {
  constructor(
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createBusinesswoner(
    userId: string,
    createBusinesswonerDto: CreateBusinesswonerDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (user.role !== 'business')
      throw new HttpException(
        'Only business user can create businesswoner',
        HttpStatus.FORBIDDEN,
      );

    const result = await this.businesswonerModel.create({
      ...createBusinesswonerDto,
      userId,
    });
    return result;
  }

  async getAllBusinesswoner(params: IFilterParams, options: IOptions) {
    const { skip, limit, page, sortBy, sortOrder } = paginationHelper(options);
    const whenCondition = buildWhereConditions(params, [
      'fullName',
      'businessName',
      'businessEmail',
      'businessPhoneNumber',
      'status',
    ]);
    const result = await this.businesswonerModel
      .find(whenCondition)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortOrder,
      })
      .exec();
    const total = await this.businesswonerModel.countDocuments(whenCondition);
    return {
      data: result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getBusinesswonerById(id: string) {
    const result = await this.businesswonerModel.findById(id);
    if (!result)
      throw new HttpException('Businesswoner not found', HttpStatus.NOT_FOUND);
    return result;
  }

  async approveBusinesswoner(id: string, adminId: string) {
    const result = await this.businesswonerModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: BusinesswonerStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    );

    if (!result)
      throw new HttpException('Businesswoner not found', HttpStatus.NOT_FOUND);

    return result;
  }

  async rejectBusinesswoner(id: string, adminId: string) {
    const result = await this.businesswonerModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: BusinesswonerStatus.REJECTED,
          rejectedBy: adminId,
          rejectedAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    );

    if (!result)
      throw new HttpException('Businesswoner not found', HttpStatus.NOT_FOUND);

    return result;
  }

  async updateBusinesswoner(
    id: string,
    updateBusinesswonerDto: UpdateBusinesswonerDto,
  ) {
    const result = await this.businesswonerModel.findByIdAndUpdate(
      id,
      updateBusinesswonerDto,
      { new: true },
    );
    if (!result)
      throw new HttpException('Businesswoner not found', HttpStatus.NOT_FOUND);
    return result;
  }

  async deleteBusinesswoner(id: string) {
    const result = await this.businesswonerModel.findByIdAndDelete(id);
    if (!result)
      throw new HttpException('Businesswoner not found', HttpStatus.NOT_FOUND);
    return result;
  }
}
