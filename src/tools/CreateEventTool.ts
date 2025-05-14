import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Ferramenta para criar um agendamento no banco de dados via Prisma.
 * Recebe título, início e término em ISO8601 e retorna confirmação ou erro.
 */
export class CreateEventTool extends StructuredTool {
    name = "create_event_tool";
    description = "Creates a calendar event with a title, start and end time (ISO8601).";

    schema = z.object({
        title: z.string().describe("Event title"),
        start: z.string().describe("Start date/time in ISO8601"),
        end: z.string().describe("End date/time in ISO8601"),
    });

    private prisma: PrismaService;

    constructor(prismaService?: PrismaService) {
        super();
        // Permite injeção para testes; utiliza PrismaService padrão caso não informado
        this.prisma = prismaService ?? new PrismaService();
    }

    async _call({ title, start, end }: { title: string; start: string; end: string; }): Promise<string> {
        try {
            await this.prisma.schedule.create({
                data: {
                    title,
                    start: new Date(start),
                    end: new Date(end),
                },
            });
            return JSON.stringify({ success: true, message: "Evento criado com sucesso." });
        } catch (error: any) {
            console.error("Erro ao criar evento:", error);
            return JSON.stringify({ success: false, message: error.message });
        }
    }
}
