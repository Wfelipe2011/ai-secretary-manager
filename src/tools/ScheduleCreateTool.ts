import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { PrismaClient } from "@prisma/client";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const prisma = new PrismaClient();

interface ScheduleCreateToolSchema {
    title: string | null;
    start: string | null;
    userPhone: string | null;
    serviceId: number | null;
}

export const ScheduleCreateTool = new DynamicStructuredTool({
    name: "create_schedule",
    description: "Creates a new schedule entry for a user and service. Returns missing fields if any required info is missing.",
    schema: z.object({
        title: z.string().optional().describe("Title of the schedule/event"),
        start: z.string().optional().describe("Start date-time in ISO format"),
        userPhone: z.string().optional().describe("User Phone to link to this schedule"),
        serviceId: z.number().optional().describe("Service ID to link to this schedule"),
    }) as unknown as ToolInputSchemaBase,
    func: async (data: ScheduleCreateToolSchema) => {
        console.log("Received data:", data);
        const required = ["title", "start", "userPhone", "serviceId"];
        const missing = required.filter(key => !data[key as keyof ScheduleCreateToolSchema]);
        if (missing.length) {
            return `Missing required fields: ${missing.join(", ")}`;
        }
        const users = await prisma.users.findMany();
        console.log("Users:", users);
        const user = await prisma.users.findUnique({ where: { phone: data.userPhone! } });
        if (!user) {
            return `User with phone number ${data.userPhone} not found.`;
        }

        const service = await prisma.services.findUnique({ where: { id: data.serviceId! } });
        if (!service) {
            return `Service with ID ${data.serviceId} not found.`;
        }

        const { title, start } = data;
        const created = await prisma.schedules.create({
            data: {
                title: title!,
                start: new Date(start!),
                user: { connect: { id: user.id } },
                service: { connect: { id: service.id } },
            }
        }).catch((error) => {
            console.error("Error creating schedule:", error);
            return `Error creating schedule: ${error.message}`;
        });

        if (typeof created === "string") {
            return created;
        }

        // calcular o horário de término
        const end = created.start
        end.setHours(end.getHours() + Number(service.duration.toString()))

        // Alimentar vector event-emitter
        return JSON.stringify({
            id: created.id,
            title: created.title,
            start: created.start,
            end: end,
            user: user,
            service: {
                id: service.id,
                name: service.name,
            },
        }, null, 2);
    }
});
