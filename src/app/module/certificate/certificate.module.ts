import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Bookkeeper,
  BookkeeperSchema,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Course,
  CourseProgress,
  CourseProgressSchema,
  CourseEnrollment,
  CourseEnrollmentSchema,
  CourseSchema,
} from '../course/entities/course.entity';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { Certificate, CertificateSchema } from './entities/certificate.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: Bookkeeper.name, schema: BookkeeperSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CourseProgress.name, schema: CourseProgressSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
    ]),
  ],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificateModule {}
