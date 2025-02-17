import { Injectable } from '@nestjs/common';
import { OpenAIService } from './ia/open-ai.service';
import { ConversationStageAI } from './domain/ConversationStageAI';
import { GreetingAI } from './domain/GreetingAI';

@Injectable()
export class AppService {
  private context: Array<{ key: string; user: string; ia?: string }> = [];
  conversationStageAI: ConversationStageAI;
  greetingAI: GreetingAI

  constructor(private readonly openAIService: OpenAIService) {
    this.conversationStageAI = new ConversationStageAI(openAIService);
    this.greetingAI = new GreetingAI(openAIService);
  }

  async chat(message: string, key: string) {
    console.log(`Received message: ${message} with key: ${key}`);

    const userMessages = this.context.map((c) => c.user).join('\n');
    console.log(`User messages for classification: ${userMessages}`);

    const stage = await this.conversationStageAI.classifyStage(message, userMessages);
    console.log(`Classified stage: ${stage}`);

    switch (stage) {
      case 'SAUDACAO':
        return this.greetingAI.greetUser(message);
    }

    this.context.push({ user: message, key });
    console.log(`Updated context: ${JSON.stringify(this.context)}`);

    return stage;
  }
}
