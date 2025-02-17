import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { Request } from 'express';
import { GoogleCalendarService } from './services/GoogleCalendarService';

@Controller('calendar')
export class CalendarController {
    constructor(readonly googleCalendarService: GoogleCalendarService) { }
    @Get('events')
    @UseGuards(AuthGuard)
    async getEvents(@Req() req: Request) {
        return this.googleCalendarService.getEvents(req['accessToken']);
    }
}
