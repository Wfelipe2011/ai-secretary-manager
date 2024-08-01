import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('chat')
  chat(@Body() body: { message: string }) {
    return this.appService.chat(body.message);
  }
}
