import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ZAPI } from './interfaces/zapi.interface';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import * as fs from 'fs';
import { google } from 'googleapis';
import { promisify } from 'util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { authenticate } from '@google-cloud/local-auth';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

async function authorize() {
  const client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  return await authenticate({
    scopes: SCOPES,
    keyfilePath: TOKEN_PATH,
  });
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = fs.readFileSync(TOKEN_PATH).toString();
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

const oAuth2Client = new google.auth.OAuth2(
  '676872687393-se791ri8ei4d7vgmg00nbjoq562vgu2r.apps.googleusercontent.com',
  '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',
  'https://f383-187-180-188-14.ngrok-free.app/callback',
);

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  // Cron que vai ler token do TOKEN_PATH e vai fazer refresh a cada 1 minutos
  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshGoogleToken() {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH).toString());
    oAuth2Client.setCredentials(token);
    const refreshAccessToken = promisify(oAuth2Client.refreshAccessToken.bind(oAuth2Client));
    await refreshAccessToken().then((newToken) => {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken));
      oAuth2Client.setCredentials(newToken);
    });
    console.log('refreshGoogleToken');
  }

  @Get('list')
  async chat(@Body() body: { message: string; phone: string }) {
    const token = (await authorize()) as any;
    const calendar = google.calendar({ version: 'v3', auth: token });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log('No upcoming events found.');
      return;
    }
    console.log('Upcoming 10 events:');
    return events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
  }

  @Get('callback')
  async authGoogleCallback(@Req() req: Request) {
    const query = req.query;
    const code = query.code as string;
    console.log(query.code);
    const getToken = promisify(oAuth2Client.getToken.bind(oAuth2Client));
    await getToken(code).then((token) => {
      console.log(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      oAuth2Client.setCredentials(token);
    });

    return 'ok';
  }

  @Post('receiver')
  async webhookReceiver(@Body() body: { sessionId: string; chatInput: string }) {
    return this.appService.chat(body.chatInput, body.sessionId);
  }
}
