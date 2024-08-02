import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class OpenAIService {
  private readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o-mini',
      temperature: 0.9,
    });
  }

  getModel() {
    return this.llm;
  }
}
