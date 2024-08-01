import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class OpenAIService {
  private readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      apiKey: 'sk-svcacct-bOAeE2JliZUrz4CzROOLT3BlbkFJxh6Fg4H3ASWAR0Wu6x4p',
      model: 'gpt-4o-mini',
      temperature: 0.9,
    });
  }

  getModel() {
    return this.llm;
  }
}
