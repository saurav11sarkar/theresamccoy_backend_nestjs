import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Bookkeeper,
  BookkeeperSchema,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerSchema,
} from '../businesswoner/entities/businesswoner.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Request, RequestSchema } from './entities/request.entity';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Request.name, schema: RequestSchema },
      { name: User.name, schema: UserSchema },
      { name: Businesswoner.name, schema: BusinesswonerSchema },
      { name: Bookkeeper.name, schema: BookkeeperSchema },
    ]),
  ],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
