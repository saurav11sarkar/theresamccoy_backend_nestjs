import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';

import { User, UserDocument } from '../user/entities/user.entity';

import {
  CreateBookkeeperAssessmentDto,
  CreateBookkeeperAvailabilityDto,
  CreateBookkeeperDto,
  CreateBookkeeperSkillsDto,
  CreateExperienceDto,
} from './dto/create-bookkeeper.dto';

import { UpdateBookkeeperDto } from './dto/update-bookkeeper.dto';

import { fileUpload } from 'src/app/helpers/fileUploder';
import { Bookkeeper, BookkeeperDocument } from './entities/bookkeeper.entity';

@Injectable()
export class BookkeeperService {
  constructor(
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Step 1 - Personal Information

  async createBookkeeper(
    userId: string,
    createBookkeeperDto: CreateBookkeeperDto,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const existingBookkeeper = await this.bookkeeperModel.findOne({
      userId: user._id,
    });

    if (existingBookkeeper) {
      throw new HttpException(
        'Bookkeeper profile already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.bookkeeperModel.create({
      ...createBookkeeperDto,
      userId: user._id,
    });
  }

  // Step 2 - Experience

  async createExperience(
    bookkeeperId: string,
    createExperienceDto: CreateExperienceDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createExperienceDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 3 - Skills

  async createSkills(
    bookkeeperId: string,
    createSkillsDto: CreateBookkeeperSkillsDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createSkillsDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 4 - Assessment

  async createAssessment(
    bookkeeperId: string,
    createAssessmentDto: CreateBookkeeperAssessmentDto,
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    const assessmentData = { ...createAssessmentDto };
    const resumeFile = files?.uploadResume?.[0];
    const assessmentFile = files?.uploadAssessment?.[0];

    if (resumeFile) {
      const resume = await fileUpload.uploadToS3(resumeFile);
      assessmentData.uploadResume = resume.url;
    }
    if (assessmentFile) {
      const assessment = await fileUpload.uploadToS3(assessmentFile);
      assessmentData.uploadAssessment = assessment.url;
    }
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: assessmentData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 5 - Availability

  async createAvailability(
    bookkeeperId: string,
    createAvailabilityDto: CreateBookkeeperAvailabilityDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createAvailabilityDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Get All

  async getAllBookkeepers(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereCondition = buildWhereConditions(params, [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'city',
      'state',
    ]);

    const bookkeepers = await this.bookkeeperModel
      .find(whereCondition)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const total = await this.bookkeeperModel.countDocuments(whereCondition);

    return {
      data: bookkeepers,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // Get Single - সব data একসাথে

  async getSingleBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findById(id);

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Update - সব section এক method দিয়ে

  async updateBookkeeper(
    id: string,
    updateBookkeeperDto: UpdateBookkeeperDto,
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    const updateData = { ...updateBookkeeperDto };
    const resumeFile = files?.uploadResume?.[0];
    const assessmentFile = files?.uploadAssessment?.[0];

    if (resumeFile) {
      const resume = await fileUpload.uploadToS3(resumeFile);
      updateData.uploadResume = resume.url;
    }

    if (assessmentFile) {
      const assessment = await fileUpload.uploadToS3(assessmentFile);
      updateData.uploadAssessment = assessment.url;
    }

    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Delete

  async removeBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndDelete(id);

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }
}
