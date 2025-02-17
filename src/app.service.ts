import { Injectable } from '@nestjs/common';
import { OpenAIService } from './ia/open-ai.service';
import { ConversationStageAI } from './domain/ConversationStageAI';
import { GreetingAI } from './domain/GreetingAI';
import { AppointmentAI } from './domain/AppointmentAI';
import { GoogleCalendarService } from './services/GoogleCalendarService';
import { LlamaIndexService } from './services/LlamaIndexService';
import { ConversationStage } from './enum/ConversationStage';

@Injectable()
export class AppService {
  private context: Array<{ key: string; user: string; ia?: string }> = [];
  conversationStageAI: ConversationStageAI;
  greetingAI: GreetingAI
  appointmentAI: AppointmentAI

  constructor(openAIService: OpenAIService, calendarService: GoogleCalendarService, llamaService: LlamaIndexService) {
    this.conversationStageAI = new ConversationStageAI(openAIService);
    this.greetingAI = new GreetingAI(openAIService);
    this.appointmentAI = new AppointmentAI(calendarService, llamaService, openAIService);
  }

  async chat(message: string, key: string, accessToken: string) {
    console.log(`Received message: ${message} with key: ${key}`);

    const userMessages = this.context.map((c) => c.user).join('\n');
    console.log(`User messages for classification: ${userMessages}`);

    const stage = await this.conversationStageAI.classifyStage(message, userMessages);
    console.log(`Classified stage: ${stage}`);

    this.context.push({ user: message, key });
    console.log(`Updated context: ${JSON.stringify(this.context)}`);

    switch (stage) {
      case ConversationStage.SAUDACAO:
        return this.greetingAI.greetUser(message);
      case ConversationStage.CONSULTAR_AGENDAMENTOS:
        return this.appointmentAI.handleUserQuestion(message, accessToken);
    }
    return stage;
  }
}
