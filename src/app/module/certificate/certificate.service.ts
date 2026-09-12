import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Course,
  CourseDocument,
  CourseProgress,
  CourseProgressDocument,
  CourseEnrollment,
  CourseEnrollmentDocument,
} from '../course/entities/course.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  Certificate,
  CertificateDocument,
} from './entities/certificate.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(CourseProgress.name)
    private readonly progressModel: Model<CourseProgressDocument>,
    @InjectModel(CourseEnrollment.name)
    private readonly enrollmentModel: Model<CourseEnrollmentDocument>,
  ) {}

  async createCertificate(
    createCertificateDto: CreateCertificateDto,
    file?: Express.Multer.File,
  ) {
    const { bookkeeperId, courseId } = createCertificateDto;
    const [bookkeeper, course, existingCertificate] = await Promise.all([
      this.bookkeeperModel.findById(bookkeeperId),
      this.courseModel.findById(courseId),
      this.certificateModel.findOne({
        $or: [
          { certificateID: createCertificateDto.certificateID },
          { bookkeeperId, courseId },
        ],
      }),
    ]);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    if (existingCertificate) {
      throw new HttpException(
        'A certificate already exists with this ID or for this bookkeeper and course',
        HttpStatus.CONFLICT,
      );
    }
    const enrollment = await this.enrollmentModel.findOne({
      userId: bookkeeper.userId,
      courseId: course._id,
    });
    if (!enrollment) {
      throw new HttpException(
        'Bookkeeper is not enrolled in this course',
        HttpStatus.BAD_REQUEST,
      );
    }
    const progress = await this.progressModel.findOne({
      userId: bookkeeper.userId,
      courseId: course._id,
    });
    if (!this.isCourseComplete(course, progress)) {
      throw new HttpException(
        'Certificate can only be issued after the bookkeeper completes the course',
        HttpStatus.BAD_REQUEST,
      );
    }
    const certificateData = { ...createCertificateDto };
    if (file) {
      const certificateUrl = await fileUpload.uploadToS3(file);
      certificateData.certificateUrl = certificateUrl.url;
    }
    const certificate = await this.certificateModel.create({
      ...certificateData,
      bookkeeperId: bookkeeper._id,
      courseId: course._id,
    });
    return certificate;
  }

  async getAllCertificates(
    params: IFilterParams,
    options: IOptions,
    requester: { id: string; role: string },
  ) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenCondition = buildWhereConditions(params, ['title']);
    if (requester.role === 'bookkeeper') {
      const bookkeeper = await this.bookkeeperModel.findOne({
        userId: requester.id,
      });
      if (!bookkeeper) {
        throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
      }
      Object.assign(whenCondition, { bookkeeperId: bookkeeper._id });
      const [result, total] = await Promise.all([
        this.certificateModel
          .find(whenCondition)
          .skip(skip)
          .limit(limit)
          .sort({ [sortBy]: sortOrder })
          .populate('bookkeeperId', 'firstName lastName email')
          .populate('courseId', 'name')
          .lean(),
        this.certificateModel.countDocuments(whenCondition),
      ]);
      return {
        data: result.map((certificate) => ({
          ...certificate,
          status: 'Given',
        })),
        meta: { total, page, limit },
      };
    }

    return this.getAdminCertificateList(params, page, limit, skip);
  }

  private async getAdminCertificateList(
    params: IFilterParams,
    page: number,
    limit: number,
    skip: number,
  ) {
    const enrollmentList = await this.enrollmentModel
      .find()
      .populate('courseId')
      .sort({ createdAt: -1 })
      .lean();
    const userIds = enrollmentList.map((enrollment) => enrollment.userId);
    const bookkeepers = await this.bookkeeperModel
      .find({ userId: { $in: userIds } })
      .lean();
    const bookkeeperByUserId = new Map(
      bookkeepers.map((bookkeeper) => [
        bookkeeper.userId.toString(),
        bookkeeper,
      ]),
    );
    const certificates = await this.certificateModel.find().lean();
    const certificateByPair = new Map(
      certificates.map((certificate) => [
        `${certificate.bookkeeperId.toString()}:${certificate.courseId.toString()}`,
        certificate,
      ]),
    );
    const searchTerm = String(params.searchTerm ?? params.title ?? '')
      .trim()
      .toLowerCase();
    const rows = await Promise.all(
      enrollmentList.map(async (enrollment) => {
        const bookkeeper = bookkeeperByUserId.get(enrollment.userId.toString());
        const course = enrollment.courseId as unknown as CourseDocument;
        if (!bookkeeper || !course?._id) return null;
        const progress = await this.progressModel.findOne({
          userId: enrollment.userId,
          courseId: course._id,
        });
        const certificate = certificateByPair.get(
          `${bookkeeper._id.toString()}:${course._id.toString()}`,
        );
        const isComplete = this.isCourseComplete(course, progress);
        return {
          _id: certificate?._id ?? enrollment._id,
          enrollmentId: enrollment._id,
          bookkeeperId: {
            _id: bookkeeper._id,
            firstName: bookkeeper.firstName,
            lastName: bookkeeper.lastName,
            email: bookkeeper.email,
          },
          courseId: { _id: course._id, name: course.name },
          completionDate: isComplete
            ? (progress as unknown as { updatedAt?: Date } | null)?.updatedAt
            : null,
          certificateID: certificate?.certificateID ?? null,
          certificateUrl: certificate?.certificateUrl ?? null,
          title: certificate?.title ?? null,
          issueDate: certificate?.issueDate ?? null,
          status: certificate ? 'Given' : isComplete ? 'Pending' : 'Not Given',
        };
      }),
    );
    const filteredRows = rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .filter((row) => {
        if (!searchTerm) return true;
        const bookkeeperName =
          `${row.bookkeeperId.firstName} ${row.bookkeeperId.lastName}`.toLowerCase();
        return (
          bookkeeperName.includes(searchTerm) ||
          row.courseId.name.toLowerCase().includes(searchTerm) ||
          (row.certificateID ?? '').toLowerCase().includes(searchTerm)
        );
      });
    return {
      data: filteredRows.slice(skip, skip + limit),
      meta: {
        total: filteredRows.length,
        page,
        limit,
      },
    };
  }

  async getCertificateById(
    id: string,
    requester: { id: string; role: string },
  ) {
    const query: Record<string, unknown> = { _id: id };
    if (requester.role === 'bookkeeper') {
      const bookkeeper = await this.bookkeeperModel.findOne({
        userId: requester.id,
      });
      if (!bookkeeper) {
        throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
      }
      query.bookkeeperId = bookkeeper._id;
    }
    const certificate = await this.certificateModel
      .findOne(query)
      .populate('bookkeeperId', 'firstName lastName email')
      .populate('courseId', 'name');
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    return certificate;
  }

  async updateCertificate(
    id: string,
    updateCertificateDto: UpdateCertificateDto,
    file?: Express.Multer.File,
  ) {
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    if (file) {
      const certificateurl = await fileUpload.uploadToS3(file);
      updateCertificateDto.certificateUrl = certificateurl.url;
    }
    const result = await this.certificateModel.findByIdAndUpdate(
      id,
      updateCertificateDto,
      { new: true },
    );
    return result;
  }

  async deleteCertificate(id: string) {
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    const result = await this.certificateModel.findByIdAndDelete(id);
    return result;
  }

  private isCourseComplete(
    course: CourseDocument,
    progress: CourseProgressDocument | null,
  ) {
    const lessonIds = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson._id.toString()),
    );
    const completedIds = (progress?.completedLessonIds ?? []).map((id) =>
      id.toString(),
    );
    return (
      lessonIds.length > 0 &&
      lessonIds.every((lessonId) => completedIds.includes(lessonId))
    );
  }
}
