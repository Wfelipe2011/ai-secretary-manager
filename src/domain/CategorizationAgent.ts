import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessageChunk } from "@langchain/core/messages";
import { ActionType } from "src/enums/ActionType";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "o4-mini",
});

const categorizationTemplate = ChatPromptTemplate.fromTemplate(`
You are an expert appointment-routing system.
Your job is to detect whether a customer is requesting to view, create, or cancel an appointment, or is simply engaging in general conversation.

<Context>
{context}
</Context>
The previous conversation is between a scheduling assistant and a user.
Determine which action the assistant should take:
    - If the user wants to view existing appointments, respond with ${ActionType.CONSULTAR_AGENDAMENTOS}.
    - If the user wants to create a new appointment, respond with ${ActionType.CRIAR_AGENDAMENTO}.
    - If the user wants to cancel an appointment, respond with ${ActionType.CANCELAR_AGENDAMENTO}.
    - If the user wants to continue the conversation, respond with ${ActionType.ATENDIMENTO}.
Your response must be one of: ${Object.values(ActionType).join(", ")}.
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