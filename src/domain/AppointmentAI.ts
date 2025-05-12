import { OpenAIService } from "src/ia/open-ai.service";
import { PrismaService } from "src/prisma/prisma.service";
import { LlamaIndexService } from "src/services/LlamaIndexService";
import dayjs from 'dayjs';

export class AppointmentAI {

    constructor(private prismaService: PrismaService, private llamaService: LlamaIndexService) { }

    async handleUserQuestion(context: string) {
        const events = await this.prismaService.schedule.findMany();

        if (events.length === 0) {
            return 'Não encontrei nenhum compromisso nos próximos 30 dias.';
        }
        const question = await this.generateOptimizedQuestion(context);
        console.log(`Generated question: ${question}`);
        // Construir o índice com base nos eventos obtidos
        await this.llamaService.buildQueryEngine(events.map(event => ({
            id: event.id,
            titulo: event.title,
            dataHora: dayjs(event.start).toISOString(),
            duracao: dayjs(event.end).diff(dayjs(event.start), 'minutes')
        })));


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
        const llm = OpenAIService.getLlm();
        const result = await llm.invoke(prompt);
        return result?.content as string || 'Qual é o meu próximo compromisso?';
    }
}
