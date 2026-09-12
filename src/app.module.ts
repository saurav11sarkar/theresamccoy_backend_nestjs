import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { ContactModule } from './app/module/contact/contact.module';
import { AuthModule } from './app/module/auth/auth.module';
import { UserModule } from './app/module/user/user.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { CourseModule } from './app/module/course/course.module';
import { BusinesswonerModule } from './app/module/businesswoner/businesswoner.module';
import { ApplicationFormModule } from './app/module/application/application-form.module';
import { BookkeeperModule } from './app/module/bookkeeper/bookkeeper.module';
import { CertificateModule } from './app/module/certificate/certificate.module';
import { MatchBookkeepersModule } from './app/module/match-bookkeepers/match-bookkeepers.module';
import { RequestModule } from './app/module/request/request.module';
import { MeetingScheduleModule } from './app/module/meeting-schedule/meeting-schedule.module';
import { EngagementModule } from './app/module/engagement/engagement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri),
    UserModule,
    AuthModule,
    ContactModule,
    DashboardModule,
    SubscribeModule,
    PaymentModule,
    WebhookModule,
    CourseModule,
    BusinesswonerModule,
    ApplicationFormModule,
    BookkeeperModule,
    CertificateModule,
    MatchBookkeepersModule,
    RequestModule,
    MeetingScheduleModule,
    EngagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
