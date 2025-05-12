import { Controller, Post, Body } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HumanMessage } from '@langchain/core/messages';
import { graph } from './domain/core';

const uuid = uuidv4()

@Controller()
export class AppController {
  constructor(
  ) { }

  @Post('/receiver')
  async chat(
    @Body('chatInput') chatInput: string,
  ) {
    console.log("Recebendo entrada do chat:", chatInput);
    
    const conversationalStream = await graph.invoke({
      messages: [new HumanMessage({ content: chatInput })],
      nextRepresentative: "RESPOND",
    }, {
      configurable: {
        thread_id: uuid
      }
    });

    const response = conversationalStream.messages[conversationalStream.messages.length - 1].content;

    console.log("Resposta final gerada:", response);

    return {
      response
    }
  }
}
