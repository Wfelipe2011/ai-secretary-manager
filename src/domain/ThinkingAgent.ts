import { StateAnnotation } from "./core"
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { CategorizationAgent } from "./CategorizationAgent";
import { ActionType } from "../enums/ActionType";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";

dayjs.extend(utc)
dayjs.extend(timezone)

const model = new ChatDeepSeek({
            apiKey: process.env.DEEPSEEK_API_KEY,
            model: 'deepseek-chat',
        });
// Dados confidenciais: Corte de cabelo dura 30 minutos, Barba dura 30 minutos.
const systemMessageTemplate = ChatPromptTemplate.fromTemplate(`
Você é um reescritor de mensagens. Sua tarefa é reescrever a mensagem do usuário de forma mais clara e objetiva, mantendo o mesmo significado.
1. [Contexto: Texto anterior] — Utilize o contexto fornecido para compreender o sentido da mensagem.
2. [Formatação de Datas/Horários: ISO 8601] — Se houver datas ou horários, converta-os para o formato 'YYYY-MM-DDThh:mm:ssZ'. Use {now} para cálculos relativos.
3. [Serviços disponíveis] — Os únicos serviços disponíveis são: Corte de cabelo, Barba e Corte de cabelo e Barba.
4. [Tempo de serviço] — Corte de cabelo dura 30 minutos, Barba dura 30 minutos.
5. [Horário de funcionamento] — O horário de funcionamento é de segunda a sexta-feira, das 9h às 18h.
6. [Data final] — Se a data final não for especificada, considere os serviços solicitados e calcule a data final com base na duração dos serviços.
7. [Confirmar se Tudo Estiver Completo] — Se todos os itens estiverem presentes, responda confirmando as informações fornecidas, sem pedir nada mais.
8. [Reescrita: primeira pessoa] — Reescreva a mensagem do usuário de forma clara, objetiva e concisa, mantendo o mesmo significado e sem adicionar informações extras.
`);

export const ThinkingAgent = async (state: typeof StateAnnotation.State): Promise<Response> => {
    console.log("Entrando no nó: thinking_agent");
    console.log("Ação atual:", state.action);
    console.log('mensagens:', state.messages?.map((message) => message.content).join("\n"));
    const systemMessagePrompt = await systemMessageTemplate.invoke({
        now: dayjs().tz("America/Sao_Paulo").format(),
    });

    const systemResponse = await model.invoke([
        new SystemMessage(systemMessagePrompt.messages[0]),
        ...state.messages,
    ]);
    console.log("Resposta do modelo no thinking_agent:", systemResponse.content);

    const categorizationResponse = await CategorizationAgent.invoke(systemResponse);
    console.log("Categorização processada no thinking_agent:", categorizationResponse.action);

    return {
        messages: [new HumanMessage({ content: systemResponse.content })],
        action: categorizationResponse.action,
        input: systemResponse.content.toString(),
    }
}

type Response = {
    messages: SystemMessage[];
    action: ActionType;
    input: string;
};