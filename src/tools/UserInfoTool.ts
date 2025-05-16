import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const prisma = new PrismaClient();
const logger = new Logger("UserInfoTool");
export const UserInfoTool = new DynamicStructuredTool({
    name: "user_info",
    description: "Receives a text containing a user's phone number and retrieves the user data from the database.",
    schema: z.object({
        phone: z.string().describe("The user's phone number."),
    }) as unknown as ToolInputSchemaBase,

    func: async ({ phone }: { phone: string }) => {
        logger.debug(`Retrieving user info for phone: ${phone}`);
        const user = await prisma.users.findUnique({
            where: { phone }
        });

        if (!user) {
            return `User with phone number ${phone} not found.`;
        }

        return JSON.stringify({ user }, null, 2);
    }
});