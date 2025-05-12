import { StateAnnotation } from "./core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ActionType } from 'src/enums/ActionType';

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4.1-mini",
})

const systemMessage = `
Você é o Assistente de Agendamento de uma Barbearia.
Quando o usuário expressar agradecimento (palavras como "obrigado", "muito obrigado", "valeu", etc.),
responda de forma cordial e conclusiva, por exemplo:
"Por nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, é só chamar."
Somente isso — não inicie novos fluxos de agendamento nem faça outras perguntas.
`;

export const ThankAgent = async (state: typeof StateAnnotation.State): Promise<Response> => {
  console.log("Entrando no nó: agradecimento_agent");
  console.log("Ação atual:", state.action);
  console.log("Entrada atual:", state.input);

  const system = new SystemMessage({ content: systemMessage });
  const user   = new HumanMessage({ content: state.input });

  // Geramos a resposta de agradecimento de forma controlada pelo modelo
  const modelResponse = await model.invoke([ system, user ]);

  console.log("Resposta do modelo no agradecimento_agent:", modelResponse.content);

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
