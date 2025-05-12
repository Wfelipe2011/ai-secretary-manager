import { StateAnnotation } from "./core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ActionType } from 'src/enums/ActionType';

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1-nano",
})

const systemMessage = `
  You are a scheduling assistant, manages customer appointments.
  Be concise in your responses.
  You can chat with customers and help them with basic scheduling inquiries, but if the customer wants to view, create, or cancel an appointment,
  do not answer directly or gather details yourself.
`;

type Response = {
  messages: SystemMessage[];
  action: ActionType;
  input: SystemMessage;
};

export const ServiceAgent = async (state: typeof StateAnnotation.State): Promise<Response> => {
  console.log("Entrando no nó: service_agent");
  console.log("Ação atual:", state.action);
  console.log("Entrada atual:", state.input);

  const systemResponse = await model.invoke([
    new SystemMessage({ content: systemMessage }),
    new HumanMessage({ content: state.input }),
  ]);

  console.log("Resposta do modelo no service_agent:", systemResponse.content);

  return {
    messages: [systemResponse],
    action: ActionType.RESPONDER,
    input: systemResponse,
  }
};
