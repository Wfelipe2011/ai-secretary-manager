import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessageChunk } from "@langchain/core/messages";
import { ActionType } from "../enums/ActionType";
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";

const model = new ChatDeepSeek({
            apiKey: process.env.DEEPSEEK_API_KEY,
            model: 'deepseek-chat',
        });

const categorizationTemplate = ChatPromptTemplate.fromTemplate(`
Você é um especialista em sistema de roteamento de agendamentos.
Sua função é detectar se um cliente está solicitando a visualização, criação ou cancelamento de um agendamento, ou se está simplesmente participando de uma conversa geral.

<Context>
{context}
</Context>
A conversa anterior é entre um assistente de agendamento e um usuário.
Determine qual ação o assistente deve tomar::
    - Se o usuário quiser visualizar os agendamentos existentes, responda com  ${ActionType.CONSULTAR_AGENDAMENTOS}.
    - Se o usuário quiser criar um novo agendamento ou confirmar um agendamento, responda com ${ActionType.CRIAR_AGENDAMENTO}.
    - Se o usuário quiser cancelar um agendamento, responda com ${ActionType.CANCELAR_AGENDAMENTO}.
    - Se o usuário estiver apenas participando de uma conversa geral, responda com ${ActionType.ATENDIMENTO}.
    - Se o usuário expressar agradecimento (por exemplo: "obrigado", "muito obrigado", "valeu"), responda com ${ActionType.AGRADECIMENTO}.
Sua resposta deve ser uma das seguintes: ${Object.values(ActionType).join(", ")}.
`);

const ActionSchema = z.object({
    action: z.nativeEnum(ActionType),
});

export class CategorizationAgent {
    static async invoke(context: AIMessageChunk): Promise<{ action: ActionType }> {
        console.log("Entrando no nó: categorization_agent");

        const categorizationPrompt = await categorizationTemplate.invoke({ context });
        const categorizateionModel = model.withStructuredOutput(ActionSchema, {
            name: "extractor",
        });
        const categorizationResponse = await categorizateionModel.invoke(categorizationPrompt);
        console.log("Categorização processada", categorizationResponse.action);

        return {
            action: categorizationResponse.action,
        };
    }
}