import { StateAnnotation } from "./core";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ActionType } from 'src/enums/ActionType';

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1-mini",
});

const systemMessage = `
Você é o Assistente de Agendamento de uma Barbearia. 
Seu papel é transformar o resultado interno da operação (por ex. "Evento criado com sucesso!") em uma mensagem final clara, cordial e humana para o usuário.
Exemplo de saída: 
"Perfeito! Seu corte de cabelo está confirmado para 12 de maio de 2025, às 15h.
Se precisar remarcar ou desejar outro serviço, é só me avisar!"
`;

export const FeedbackAgent = async (state: typeof StateAnnotation.State): Promise<Response> => {
  console.log("Entrando no nó: feedback_agent");
  console.log("Ação atual:", state.action);
  console.log("Entrada atual:", state.input);

  const modelResponse = await model.invoke([
    new SystemMessage({ content: systemMessage }),
    ...state.messages,
  ]);

  console.log("Resposta do modelo no feedback_agent:", modelResponse.content);

  return {
    messages: [modelResponse],
    action: ActionType.RESPONDER,
    input: modelResponse.content.toString(),
  };
};

type Response = {
  messages: SystemMessage[];
  action: ActionType;
  input: string;
};
