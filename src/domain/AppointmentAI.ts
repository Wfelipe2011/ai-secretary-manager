import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { OpenAIService } from "src/ia/open-ai.service";
import { GoogleCalendarService } from "src/services/GoogleCalendarService";
import { LlamaIndexService } from "src/services/LlamaIndexService";

export class AppointmentAI {

    constructor(private calendarService: GoogleCalendarService, private llamaService: LlamaIndexService, private openAIService: OpenAIService) { }

    async handleUserQuestion(context: string, accessToken: string) {
        const events = await this.calendarService.getEvents(accessToken);

        if (events.length === 0) {
            return 'Não encontrei nenhum compromisso nos próximos 30 dias.';
        }
        const question = await this.generateOptimizedQuestion(context);
        console.log(`Generated question: ${question}`);
        // Construir o índice com base nos eventos obtidos
        await this.llamaService.buildQueryEngine(events);


        // Gerar uma pergunta clara para o LlamaIndex
        const prompt = `
      O usuário fez a seguinte pergunta: "${question}".
      Responda com base nos compromissos agendados para os próximos 30 dias de forma humanizado.
    `;

        // Consultar o LlamaIndex
        const response = await this.llamaService.query(prompt);
        return response;
    }

    private async generateOptimizedQuestion(context: string): Promise<string> {
        const prompt = `
      Given the following context: "${context}", generate a clear and specific question to search for information related to calendar events. 
      The question should be direct and focused on events starting from ${new Date().toISOString()}. 
      If the query mentions a specific day, calculate the corresponding date and use it YYYY-MM-DD.
        `;

        const result = await this.openAIService.llm.invoke(prompt);
        return result?.content as string || 'Qual é o meu próximo compromisso?';
    }
}
