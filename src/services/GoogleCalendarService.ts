import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
    async getEvents(accessToken: string) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client, });

        const events = await calendar.events.list({
            calendarId: 'dc6912b6f4cd50684d60b725e0c027e0ce747445ab93b2253499b9f3b6033bf3@group.calendar.google.com',
            timeMin: new Date().toISOString(),
            timeMax: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',

        });

        return events.data.items?.map(event => ({
            id: event.id,
            titulo: event.summary || 'Evento sem título',
            descricao: event.description || '',
            dataHora: event.start?.dateTime || event.start?.date,
            duracao: event.end?.dateTime
                ? (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime!).getTime()) / 60000
                : 0,
        })) || [];
    }
}
