import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class OpenAIService {
  readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo-0125',
      temperature: 0,
      cache: true,
    });
  }
}
