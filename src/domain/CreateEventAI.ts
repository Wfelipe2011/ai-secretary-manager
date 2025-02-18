import { OpenAIService } from "src/ia/open-ai.service";
import { GoogleCalendarService } from "src/services/GoogleCalendarService";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// Definindo o esquema para validação de dados de evento
const eventSchema = z.object({
    title: z.optional(z.string()).describe("O título do evento"),
    description: z.optional(z.string()).describe("Descrição do evento, caso disponível"),
    startDate: z.optional(z.string()).describe("Data de início do evento yyyy-mm-ddThh:mm:ss"),
    endDate: z.optional(z.string()).describe("Data de término do evento yyyy-mm-ddThh:mm:ss"),
    location: z.optional(z.string()).describe("Localização do evento, se disponível"),
});

// Definindo o template de prompt para extração de informações de agendamento
const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are an expert in extracting scheduling data. Please extract only the relevant details about the event. If any data is missing or cannot be determined, return '' for the corresponding attribute. Events can only be scheduled after {now}.",
    ],
    ["human", "{text}"],
]);

export class CreateEventAI {

    constructor(
        private calendarService: GoogleCalendarService,
        private openAIService: OpenAIService
    ) { }

    async handleCreateEvent(message: string, accessToken: string) {
        console.log("handleCreateEvent called with message:", message);

        const llmWithStructuredOutput = this.openAIService.llm.withStructuredOutput(eventSchema);
        const prompt = await promptTemplate.invoke({ text: message, now: new Date().toISOString() });
        console.log("Generated prompt:", prompt);

        const eventData = await llmWithStructuredOutput.invoke(prompt);
        console.log("Extracted event data:", eventData);

        const validationResult = await this.validateEventData(eventData);
        console.log("Validation result:", validationResult);

        // Se a validação retornar erros, perguntamos o que falta
        if (validationResult.errors.length > 0) {
            console.log("Validation errors found:", validationResult.errors);
            return this.generateValidationErrorResponse(validationResult.errors);
        }

        // Verificar se o evento entra em conflito com outros eventos
        const conflicts = await this.checkEventConflict(eventData, accessToken);
        console.log("Conflicts found:", conflicts);

        if (conflicts.length > 0) {
            return `Houve um conflito de horário. Você já tem compromissos nesses horários: ${conflicts.join(", ")}.`;
        }

        // Criar o evento, se passar na validação e não houver conflitos
        const newEvent = await this.calendarService.createEvent(eventData, accessToken);
        console.log("Event created successfully:", newEvent);

        return `O evento foi criado com sucesso: ${newEvent.summary} no dia ${newEvent.start.dateTime}.`;
    }

    // Função de validação de dados para o evento
    private async validateEventData(eventData: any): Promise<{ errors: string[] }> {
        console.log("Validating event data:", eventData);

        const errors: string[] = [];

        // Verificar se falta algum dado essencial
        if (!eventData.title) errors.push('O título do evento está faltando.');
        if (!eventData.startDate) errors.push('A data de início do evento está faltando.');
        if (!eventData.endDate) errors.push('A data de término do evento está faltando.');
        // if (!eventData.location) errors.push('O local do evento está faltando.');

        // Retornar os erros encontrados
        console.log("Validation errors:", errors);
        return { errors };
    }

    // Função para gerar mensagem personalizada em caso de erro de validação
    private async generateValidationErrorResponse(errors: string[]): Promise<string> {
        console.log("Generating validation error response for errors:", errors);

        const context = errors.join(", ");
        const question = await this.generateOptimizedQuestion(context);

        console.log("Generated question for missing data:", question);
        return `Parece que há informações faltando. Para criar o evento corretamente, precisamos dos seguintes dados: ${question}`;
    }

    // Função para verificar conflitos de horários
    private async checkEventConflict(eventData: any, accessToken: string): Promise<string[]> {
        console.log("Checking event conflicts for event data:", eventData);

        const events = await this.calendarService.getEvents(accessToken);
        console.log("Fetched existing events:", events);

        const conflicts: string[] = [];

        // Verificar se o novo evento entra em conflito com eventos existentes
        for (const event of events) {
            if (this.isConflict(event, eventData)) {
                conflicts.push(`${event.titulo} no dia ${event.dataHora}`);
            }
        }

        console.log("Conflicts detected:", conflicts);
        return conflicts;
    }

    // Função para verificar se dois eventos entram em conflito
    private isConflict(existingEvent: any, newEvent: any): boolean {
        console.log("Checking conflict between existing event and new event:", existingEvent, newEvent);

        const existingStart = new Date(existingEvent.dataHora).getTime();
        const existingEnd = new Date(existingEvent.dataHoraFim).getTime();
        const newStart = new Date(newEvent.startDate).getTime();
        const newEnd = new Date(newEvent.endDate).getTime();

        // Verificar se os horários se sobrepõem
        const conflict = (newStart < existingEnd && newEnd > existingStart);
        console.log("Conflict result:", conflict);

        return conflict;
    }

    // Função para gerar uma pergunta otimizada sobre o contexto
    private async generateOptimizedQuestion(context: string): Promise<string> {
        console.log("Generating optimized question for context:", context);

        const prompt = `
        Dado o seguinte contexto: "${context}",
        gere uma pergunta clara e específica para solicitar as informações faltantes para a criação de um evento no calendário.
        A pergunta deve ser direta e objetiva, ajudando a identificar o que está faltando.
        `;

        const result = await this.openAIService.llm.invoke(prompt);
        console.log("Generated optimized question result:", result);

        return result?.content as string || 'Quais dados estão faltando para criar o evento?';
    }
}
