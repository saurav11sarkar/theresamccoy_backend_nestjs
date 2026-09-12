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
import { MatchBookkeepersService } from './match-bookkeepers.service';
import { MatchBookkeepersController } from './match-bookkeepers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bookkeeper.name, schema: BookkeeperSchema },
      { name: Businesswoner.name, schema: BusinesswonerSchema },
    ]),
  ],
  controllers: [MatchBookkeepersController],
  providers: [MatchBookkeepersService],
})
export class MatchBookkeepersModule {}
