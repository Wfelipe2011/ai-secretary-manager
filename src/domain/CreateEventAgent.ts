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

const categorizationTemplate = `
Analise a mensagem do usuário e execute os passos abaixo:

1. [Verificação de Campos Obrigatórios] — Confira se a mensagem inclui:
   - [Serviço] (Corte de cabelo, Barba ou Corte de cabelo e Barba)  
   - [Data] (dia, mês e ano ou termo relativo como “hoje”, “amanhã”)  
   - [Hora de Início] (horário específico)

2. [Perguntar se Faltar Informação] — Se qualquer um dos itens acima estiver ausente, faça uma pergunta direta solicitando apenas a informação faltante.  
   - Exemplo: “Qual serviço você deseja agendar?”  
   - Exemplo: “Em que dia e horário você gostaria de agendar?”  

3. [Tempo de Serviço] — Utilize a duração padrão dos serviços para cálculos e confirmações:
   - Corte de cabelo: 30 minutos  
   - Barba: 30 minutos  
   - Corte de cabelo e Barba: 60 minutos

4. [Horário de Funcionamento] — Os agendamentos podem ser feitos apenas de segunda a sexta-feira, das 09:00 às 18:00.  
   - Se o horário solicitado estiver fora desse intervalo, informe: “Nosso horário de funcionamento é de segunda a sexta-feira, das 09:00 às 18:00. Por favor, escolha outro horário.”

5. [Cálculo de Data Final] — Se a data ou horário final não forem especificados, calcule a hora de término com base na duração do serviço:
   - Exemplo: para um Corte de cabelo iniciado às 14:00, informe término às 14:30.

6. [Confirmar se Tudo Estiver Completo] — Se todos os itens estiverem presentes, responda confirmando as informações fornecidas, sem pedir nada mais.  
   - Exemplo: “Perfeito! Você deseja agendar um Corte de cabelo em 2025-05-12 14:00:00?”  

7. [Criar Evento] — Se o usuário confirmar, e todas as informações estiverem corretas, não retorne nada.
`;

const validationSchema = z.object({
  title: z.string().nullable().describe("Título do evento ou null"),
  start: z.string().nullable().describe("Data/hora de início em ISO8601 ou null"),
  end: z.string().nullable().describe("Data/hora de término em ISO8601 ou null"),
  output: z.string().nullable().describe("Saída do modelo ou null"),
});

export async function CreateEventAgent(state: typeof StateAnnotation.State): Promise<Response> {
  console.log("Entrando no nó: create_event_agent");
  console.log("Ação atual:", state.action);
  console.log("Entrada atual:", state.input);

  const categorizationModel = model.withStructuredOutput(validationSchema);
  const categorizationResponse = await categorizationModel.invoke([
    new SystemMessage(categorizationTemplate),
    ...state.messages,
  ]);
  console.log("Categorização processada", categorizationResponse);

  if (categorizationResponse?.output) {
    return {
      messages: [new AIMessage(categorizationResponse.output)],
      action: ActionType.RESPONDER,
      input: categorizationResponse.output,
    };
  }

  // se faltar algum dado, chame o modelo novamente pedido para repetir novamente os dados
  if (categorizationResponse?.title === null || categorizationResponse?.start === null || categorizationResponse?.end === null) {
    console.log("Faltando dados para criar o evento");
    const missingDataResponse = await model.invoke([
      ...state.messages,
      new SystemMessage("Faltando dados para criar o evento"),
    ]);
    console.log("Resposta do modelo para dados faltando:", missingDataResponse.content);
    return {
      messages: [new AIMessage({ content: missingDataResponse.content })],
      action: ActionType.RESPONDER,
      input: missingDataResponse.content.toString()
    };
  }

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
      input: "Evento criado com sucesso!",
    };
  }
}

type Response = {
  messages: SystemMessage[];
  action: ActionType;
  input: string;
};