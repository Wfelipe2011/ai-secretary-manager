import { Controller, Post, Body, Param } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HumanMessage } from '@langchain/core/messages';
import { graph } from './domain/core';

const uuid = uuidv4()

@Controller()
export class AppController {
  constructor(
  ) { }

  @Post('/chat/:phone')
  async chat(
    @Param('phone') phone: string,
    @Body('message') message: string,
  ) {

    return {

    }
  }

  @Post('/receiver')
  async receiver(
    @Body('chatInput') chatInput: string,
  ) {
    console.log("Recebendo entrada do chat:", chatInput);

    const conversationalStream = await graph.invoke({
      messages: [new HumanMessage({ content: chatInput })],
    }, {
      configurable: {
        thread_id: uuid
      }
    });

    const response = conversationalStream.messages[conversationalStream.messages.length - 1].content;

    console.log("Resposta final gerada:", response);
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulando um atraso de 2 segundos
    return {
      response
      // response: "Resposta gerada com sucesso",
    }
  }
}
