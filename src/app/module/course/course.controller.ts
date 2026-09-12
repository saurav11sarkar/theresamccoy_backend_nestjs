/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from 'src/app/helpers/fileUploder';
import type { IOptions } from 'src/app/helpers/pagenation';
import type { IFilterParams } from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { MultipartJsonInterceptor } from 'src/app/utils/multipart-json.interceptor';
import { CourseService } from './course.service';
import {
  AddLessonDto,
  AddModuleDto,
  AddQuizDto,
  AddQuizOptionDto,
  CreateCourseDto,
} from './dto/create-course.dto';
import {
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/update-course.dto';

@ApiTags('Course')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new course (with cover photo upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'photo', maxCount: 1 }],
      fileUpload.uploadConfig,
    ),
    MultipartJsonInterceptor,
  )
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
    },
  ) {
    const photoFile = files?.photo?.[0];
    const result = await this.courseService.createCourse(
      createCourseDto,
      photoFile,
    );
    return {
      message: 'Course created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all courses with pagination and search',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper', 'user'))
  @HttpCode(HttpStatus.OK)
  async getAllCourse(
    @Req() req: Request,
    @Query() params: IFilterParams,
    @Query() options: IOptions,
  ) {
    const result = await this.courseService.getAllCourse(
      params,
      options,
      req.user!.role,
    );
    return {
      message: 'Courses retrieved successfully',
      ...result,
    };
  }

  @Get('my/all')
  @ApiOperation({
    summary: 'Get all published courses with my progress',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async getMyAllCourses(@Req() req: Request) {
    const data = await this.courseService.getMyAllCourses(req.user!.id);
    return {
      message: 'My courses retrieved successfully',
      data,
    };
  }

  @Get('enrollments/me')
  @ApiOperation({ summary: 'Get my course enrollments' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  async getMyEnrollments(@Req() req: Request) {
    const data = await this.courseService.getMyEnrollments(req.user!.id);
    return { message: 'My enrollments retrieved successfully', data };
  }

  @Get('enrollments/all')
  @ApiOperation({ summary: 'Admin gets all course enrollments' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async getAllEnrollments() {
    const data = await this.courseService.getAllEnrollments();
    return { message: 'Enrollments retrieved successfully', data };
  }

  @Get(':courseId')
  @ApiOperation({
    summary: 'Get single course details',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper', 'user'))
  @HttpCode(HttpStatus.OK)
  async getSingleCourse(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ) {
    const result = await this.courseService.getSingleCourse(
      courseId,
      req.user!.role,
    );
    return {
      message: 'Course retrieved successfully',
      data: result,
    };
  }

  @Patch(':courseId')
  @ApiOperation({ summary: 'Admin update a course' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'photo', maxCount: 1 }],
      fileUpload.uploadConfig,
    ),
  )
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: { photo?: Express.Multer.File[] },
  ) {
    const data = await this.courseService.updateCourse(
      courseId,
      dto,
      files?.photo?.[0],
    );
    return { message: 'Course updated successfully', data };
  }

  @Delete(':courseId')
  @ApiOperation({ summary: 'Admin delete a course' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async deleteCourse(@Param('courseId') courseId: string) {
    const data = await this.courseService.deleteCourse(courseId);
    return { message: 'Course deleted successfully', data };
  }

  @Post(':courseId/module')
  @ApiOperation({
    summary: 'Add a new module to a course',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async addModule(
    @Param('courseId') courseId: string,
    @Body() dto: AddModuleDto,
  ) {
    const result = await this.courseService.addModule(courseId, dto);
    return {
      message: 'Module added successfully',
      data: result,
    };
  }

  @Post(':courseId/enroll')
  @ApiOperation({ summary: 'Bookkeeper enrolls in a course' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.CREATED)
  async enrollCourse(@Req() req: Request, @Param('courseId') courseId: string) {
    const data = await this.courseService.enrollCourse(req.user!.id, courseId);
    return { message: 'Course enrolled successfully', data };
  }

  @Patch(':courseId/module/:moduleId')
  @ApiOperation({ summary: 'Admin update a course module' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async updateModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    const data = await this.courseService.updateModule(courseId, moduleId, dto);
    return { message: 'Module updated successfully', data };
  }

  @Delete(':courseId/module/:moduleId')
  @ApiOperation({ summary: 'Admin delete a course module' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async deleteModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const data = await this.courseService.deleteModule(courseId, moduleId);
    return { message: 'Module deleted successfully', data };
  }

  @Post(':courseId/module/:moduleId/lesson')
  @ApiOperation({
    summary:
      'Add a new lesson to a module (with video / resource PDF / thumbnail image upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'resource', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async addLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() addLessonDto: AddLessonDto,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      resource?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const videoFile = files?.video?.[0];
    const resourceFile = files?.resource?.[0];
    const thumbnailFile = files?.thumbnail?.[0];
    const result = await this.courseService.addLesson(
      courseId,
      moduleId,
      addLessonDto,
      videoFile,
      resourceFile,
      thumbnailFile,
    );
    return {
      message: 'Lesson added successfully',
      data: result,
    };
  }

  @Patch(':courseId/lesson/:lessonId')
  @ApiOperation({ summary: 'Admin update a lesson and its files' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'resource', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      resource?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const data = await this.courseService.updateLesson(
      courseId,
      lessonId,
      dto,
      files?.video?.[0],
      files?.resource?.[0],
      files?.thumbnail?.[0],
    );
    return { message: 'Lesson updated successfully', data };
  }

  @Delete(':courseId/module/:moduleId/lesson/:lessonId')
  @ApiOperation({ summary: 'Admin delete a lesson' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const data = await this.courseService.deleteLesson(
      courseId,
      moduleId,
      lessonId,
    );
    return { message: 'Lesson deleted successfully', data };
  }

  @Post(':courseId/lesson/:lessonId/quiz')
  @ApiOperation({
    summary: 'Add a new quiz to a lesson (with question image upload)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async addQuiz(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() addQuizDto: AddQuizDto,
  ) {
    const result = await this.courseService.addQuiz(
      courseId,
      lessonId,
      addQuizDto,
    );
    return {
      message: 'Quiz added successfully',
      data: result,
    };
  }

  @Post(':courseId/quiz/:quizId/option')
  @ApiOperation({ summary: 'Admin add an option to a quiz' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async addQuizOption(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @Body() dto: AddQuizOptionDto,
  ) {
    const data = await this.courseService.addQuizOption(courseId, quizId, dto);
    return { message: 'Quiz option added successfully', data };
  }

  @Post(':courseId/lesson/:lessonId/complete')
  @ApiOperation({ summary: 'Bookkeeper marks a lesson as completed' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  async markLessonComplete(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const data = await this.courseService.markLessonComplete(
      req.user!.id,
      courseId,
      lessonId,
    );
    return { message: 'Lesson completed successfully', data };
  }

  @Get(':courseId/progress')
  @ApiOperation({ summary: 'Get my course progress' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  async getMyProgress(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ) {
    const data = await this.courseService.getMyProgress(req.user!.id, courseId);
    return { message: 'Course progress retrieved successfully', data };
  }

  @Post(':courseId/lesson/:lessonId/assignment')
  @ApiOperation({ summary: 'Bookkeeper submits or replaces an assignment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Assignment file (PDF, DOCX, XLSX, or image)',
        },
      },
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @UseInterceptors(FileInterceptor('file', fileUpload.uploadConfig))
  async submitAssignment(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.courseService.submitAssignment(
      req.user!.id,
      courseId,
      lessonId,
      file,
    );
    return { message: 'Assignment submitted successfully', data };
  }

  @Get(':courseId/submissions/me')
  @ApiOperation({ summary: 'Get my course assignment submissions' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  async getMySubmissions(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ) {
    const data = await this.courseService.getMySubmissions(
      req.user!.id,
      courseId,
    );
    return { message: 'Submissions retrieved successfully', data };
  }
}
