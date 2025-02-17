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
      Responda com base nos compromissos agendados para os próximos 30 dias.
      Utilize uma linguagem simples e objetiva.
    `;

        // Consultar o LlamaIndex
        const response = await this.llamaService.query(prompt);
        return response;
    }

    private async generateOptimizedQuestion(context: string): Promise<string> {
        const prompt = `
        Dado o seguinte contexto: "${context}",
        gere uma pergunta clara e específica para buscar informações relacionadas a compromissos no calendário.
        A pergunta deve ser direta e objetiva, focada em eventos futuros.
        `;

        const result = await this.openAIService.llm.invoke(prompt);
        return result?.content as string || 'Qual é o meu próximo compromisso?';
    }
}
