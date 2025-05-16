import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';


@Module({
  imports: [
    HttpModule, 
    PrismaModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(), 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {

}
