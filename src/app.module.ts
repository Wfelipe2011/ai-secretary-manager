import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [HttpModule, ScheduleModule.forRoot(), PrismaModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {

}
