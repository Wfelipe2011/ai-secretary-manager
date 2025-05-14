import { z } from "zod";
import { StructuredTool } from "langchain/tools";
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";

export class TranslationTool extends StructuredTool {
    name = "text_translator";
    description = "Traduz texto de português para inglês";

    schema = z.object({
        text: z.string().describe("Texto em português para traduzir"),
        context: z.string().optional().describe("Contexto adicional para melhor tradução")
    });

    private translator: ChatDeepSeek;

    constructor() {
        super();
        this.translator = new ChatDeepSeek({
                    apiKey: process.env.DEEPSEEK_API_KEY,
                    model: 'deepseek-chat',
                });
    }

    async _call({ text, context }: z.infer<typeof this.schema>) {
        const prompt = `
    Traduza para o inglês o seguinte texto em português:
    
    Contexto: ${context || "Agendamento de serviços"}
    
    Texto: "${text}"
    
    Regras:
    1. Traduza o resto do texto normalmente
    
    Apenas retorne a tradução, sem comentários.
    `;

        const response = await this.translator.invoke(prompt);
        return response.content.toString();
    }
}