import { Injectable } from '@nestjs/common';
import { OpenAIService } from './ia/open-ai.service';
import { ConversationStageAI } from './domain/ConversationStageAI';
import { GreetingAI } from './domain/GreetingAI';
import { AppointmentAI } from './domain/AppointmentAI';
import { GoogleCalendarService } from './services/GoogleCalendarService';
import { LlamaIndexService } from './services/LlamaIndexService';
import { ConversationStage } from './enum/ConversationStage';
import { CreateEventAI } from './domain/CreateEventAI';
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

@Injectable()
export class AppService {
  private context: Array<HumanMessage | AIMessage> = [];
  conversationStageAI: ConversationStageAI;
  greetingAI: GreetingAI
  appointmentAI: AppointmentAI
  createEventAI: CreateEventAI;

  constructor(private openAIService: OpenAIService, calendarService: GoogleCalendarService, llamaService: LlamaIndexService) {
    this.conversationStageAI = new ConversationStageAI(openAIService);
    this.greetingAI = new GreetingAI(openAIService);
    this.appointmentAI = new AppointmentAI(calendarService, llamaService, openAIService);
    this.createEventAI = new CreateEventAI(calendarService, openAIService)
  }

  async chat(message: string, key: string, accessToken: string) {
    console.log(`Received message: ${message} with key: ${key}`);
    this.context.push(new HumanMessage(message));
    const rewriteMessage = await this.rewriteMessage();
    const stage = await this.conversationStageAI.classifyStage(rewriteMessage);
    console.log(`Classified stage: ${stage}`);

    switch (stage) {
      case ConversationStage.SAUDACAO: {
        const res = await this.greetingAI.greetUser(rewriteMessage);
        this.context.push(new AIMessage(res as string))
        return res;
      }
      case ConversationStage.CONSULTAR_AGENDAMENTOS: {
        const res = await this.appointmentAI.handleUserQuestion(rewriteMessage, accessToken);
        this.context.push(new AIMessage(res as string))
        return res;
      }
      case ConversationStage.CRIAR_AGENDAMENTO: {
        const res = await this.createEventAI.handleCreateEvent(rewriteMessage, accessToken);
        this.context.push(new AIMessage(res as string))
        return res;
      }
    }
    return stage;
  }

  async rewriteMessage() {
    this.context.push(new SystemMessage("Reescreva a mensagem numa declaração clara, transmitindo a mensagem pretendida na primeira pessoa"));
    const res = await this.openAIService.llm.invoke(this.context)
    const resContent = res.content.toString();
    const message = `${res.content}`
    console.log(message);
    return res.content.toString();
  }
}
