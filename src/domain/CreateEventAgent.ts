import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateAnnotation } from "./core";
import { PrismaService } from "src/prisma/prisma.service";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ActionType } from "src/enums/ActionType";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "o4-mini",
});

const categorizationTemplate = ChatPromptTemplate.fromTemplate(`
Sua tarefa é verificar se o usuário forneceu todas as informações necessárias para criar um evento de agendamento(data e hora de início e término + indentificação do evento).
Se o usuário não forneceu todas as informações, você deve perguntar o que está faltando.
Se o usuário forneceu todas as informações, você NÃO deve perguntar nada.
Usuario:{message}
Pergunta: 
`);

const validationSchema = z.object({
  title: z.string().nullable().describe("Título do evento ou null"),
  start: z.string().nullable().describe("Data/hora de início em ISO8601 ou null"),
  end: z.string().nullable().describe("Data/hora de término em ISO8601 ou null"),
  question: z.string().nullable().describe("Pergunta para dados faltantes ou null"),
});

type Response = {
  messages: SystemMessage[];
  action: ActionType;
  input: SystemMessage;
};

export async function CreateEventAgent(state: typeof StateAnnotation.State): Promise<Response> {
  console.log("Entrando no nó: create_event_agent");
  console.log("Ação atual:", state.action);
  console.log("Entrada atual:", state.input);

  const categorizationPrompt = await categorizationTemplate.invoke({
    message: state.input,
  });
  const categorizationModel = model.withStructuredOutput(validationSchema);
  const categorizationResponse = await categorizationModel.invoke(categorizationPrompt);
  console.log("Categorização processada", categorizationResponse);

  if (categorizationResponse.title && categorizationResponse.start && categorizationResponse.end) {
    console.log("Criando evento no banco de dados...");
    const prismaService = new PrismaService();
    await prismaService.schedule.create({
      data: {
        title: categorizationResponse.title,
        start: new Date(categorizationResponse.start),
        end: new Date(categorizationResponse.end),
      }
    });

    return {
      messages: [
        new AIMessage("Evento criado com sucesso!")
      ],
      action: ActionType.RESPONDER,
      input: new AIMessage("Evento criado com sucesso!"),
    };
  }

  return {
    messages: [new AIMessage(categorizationResponse.question || "Faltam dados para criar o evento")],
    action: ActionType.RESPONDER,
    input: new AIMessage(categorizationResponse.question || "Faltam dados para criar o evento"),
  };
}