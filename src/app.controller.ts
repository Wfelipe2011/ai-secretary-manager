import { MemorySaver, StateGraph } from '@langchain/langgraph';
import { Body, Controller, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventAgent } from './agents/EventAgent';
import { StateAnnotation } from './graph/graph-state-annotation';

const checkpointer = new MemorySaver();
const uuid = uuidv4()
const eventAgent = EventAgent.createAgent();
const builder = new StateGraph(StateAnnotation);

builder
  .addNode(EventAgent.name, eventAgent.invoke.bind(eventAgent))
  .addEdge("__start__", EventAgent.name)
  .addEdge(EventAgent.name, "__end__")
@Controller()
export class AppController {
  constructor(
  ) { }

  @Post('/receiver')
  async chat(
    @Body('chatInput') chatInput: string,
  ) {

    const graph = builder.compile({ checkpointer });
    const conversationalStream = await graph.invoke({
      input: chatInput,
    }, {
      configurable: {
        thread_id: uuid
      }
    });

    return conversationalStream['output']
  }

  @Post('/receiver/:phone')
  async receiver(
    @Body('chatInput') chatInput: string,
  ) {
    // console.log("Recebendo entrada do chat:", chatInput);

    // const conversationalStream = await graph.invoke({
    //   messages: [new HumanMessage({ content: chatInput })],
    // }, {
    //   configurable: {
    //     thread_id: uuid
    //   }
    // });

    // const response = conversationalStream.messages[conversationalStream.messages.length - 1].content;

    // console.log("Resposta final gerada:", response);
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulando um atraso de 2 segundos
    // return {
    //   response
    //   // response: "Resposta gerada com sucesso",
    // }
  }
}
