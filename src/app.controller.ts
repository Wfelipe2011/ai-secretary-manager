import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ZAPI } from './interfaces/zapi.interface';
import { HttpService } from '@nestjs/axios';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  @Post('chat')
  chat(@Body() body: { message: string; phone: string }) {
    return this.appService.chat(body.message, body.phone);
  }

  @Post('webhook-receiver')
  async webhookReceiver(@Body() body: ZAPI) {
    console.log(body);
    if (!body.phone.includes('5706')) return;
    const message = (await this.appService.chat(body.text.message, body.phone))
      .replace('<END_OF_TURN>', '')
      .replace('<END_OF_CALL>', '');
    const res = await this.httpService.axiosRef
      .post(
        `https://api.z-api.io/instances/${process.env.INSTANCE}/token/${process.env.TOKEN_INSTANCE}/send-text`,
        {
          message,
          phone: body.phone,
        },
        {
          headers: {
            'client-token': process.env.CLIENT_TOKEN,
          },
        },
      )
      .catch((e) => {
        console.log(e);
        throw e;
      });

    console.log(res.data);
  }

  @Post('webhook-send')
  async webhookSend(@Body() body: ZAPI) {
    console.log('webhook-send', body);
  }
}
