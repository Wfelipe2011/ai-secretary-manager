import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
    async getEvents(accessToken: string) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
            dataHoraFim: event.end?.dateTime || event.end?.date,
            duracao: event.end?.dateTime
                ? (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime!).getTime()) / 60000
                : 0,
        })) || [];
    }

    // Função para validar os dados necessários para a criação de um evento
    validateEventData(eventData: any): string[] {
        const errors: string[] = [];

        if (!eventData.title) errors.push('O título do evento está faltando.');
        if (!eventData.startDate) errors.push('A data de início do evento está faltando.');
        if (!eventData.endDate) errors.push('A data de término do evento está faltando.');
        if (!eventData.location) errors.push('O local do evento está faltando.');

        return errors;
    }

    // Função para verificar conflitos entre o novo evento e eventos já agendados
    async checkEventConflict(eventData: any, accessToken: string): Promise<string[]> {
        const events = await this.getEvents(accessToken);
        const conflicts: string[] = [];

        // Verificar se o novo evento entra em conflito com eventos existentes
        for (const event of events) {
            if (this.isConflict(event, eventData)) {
                conflicts.push(`${event.titulo} no dia ${event.dataHora}`);
            }
        }

        return conflicts;
    }

    // Função para verificar se dois eventos entram em conflito
    private isConflict(existingEvent: any, newEvent: any): boolean {
        const existingStart = new Date(existingEvent.dataHora).getTime();
        const existingEnd = new Date(existingEvent.duracao).getTime() + existingStart;
        const newStart = new Date(newEvent.startDate).getTime();
        const newEnd = new Date(newEvent.endDate).getTime();

        // Verificar se os horários se sobrepõem
        return (newStart < existingEnd && newEnd > existingStart);
    }

    // Função para criar um evento no Google Calendar
    async createEvent(eventData: any, accessToken: string) {
        console.log("eventData", eventData)
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = {
            summary: eventData.title,
            description: eventData.description || '',
            location: eventData.location || '',
            start: {
                dateTime: new Date(eventData.startDate).toISOString(),
                timeZone: 'America/Sao_Paulo',
            },
            end: {
                dateTime: new Date(eventData.endDate).toISOString(),
                timeZone: 'America/Sao_Paulo',
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'dc6912b6f4cd50684d60b725e0c027e0ce747445ab93b2253499b9f3b6033bf3@group.calendar.google.com',
            requestBody: event,
        });

        return response.data;
    }
}
