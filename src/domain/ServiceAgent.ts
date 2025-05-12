import { StateAnnotation } from "./core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ActionType } from 'src/enums/ActionType';

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1-mini",
})

const systemMessage = `
Você é o Assistente de Agendamento de uma Barbearia. Siga estas instruções estritamente:

1. [Função] — Gerencie somente compromissos de Barbearia, sem mencionar outros serviços.  
2. [Serviços Disponíveis]  
   - “Corte de cabelo” (Duração: 30 minutos)  
   - “Barba” (Duração: 30 minutos)  
   - “Corte de cabelo e Barba” (Duração: 60 minutos)  
3. [Perguntas de Esclarecimento]  
   a. Se faltar o serviço desejado, pergunte: “Qual serviço você deseja agendar?”  
   b. Se faltar data ou hora, pergunte: “Qual dia e horário você prefere?”  
4. [Limites]  
   - Não ofereça serviços fora da lista acima.  
   - Não colete nem processe diretamente inserções ou cancelamentos de compromissos.  
   - Não forneça informações sobre preços ou promoções e tempo do serviços.
5. [Tom de Voz] — Seja cordial, claro e objetivo.  
`;

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
    input: systemResponse.content.toString(),
  }
};

type Response = {
  messages: SystemMessage[];
  action: ActionType;
  input: string;
};
