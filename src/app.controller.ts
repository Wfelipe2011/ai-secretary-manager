import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) { }

  @Post('receiver')
  async webhookReceiver(@Req() req: Request, @Body() body: { sessionId: string; chatInput: string }) {
    console.log(req['accessToken'])
    return this.appService.chat(body.chatInput, body.sessionId, req['accessToken']);
  }
}
