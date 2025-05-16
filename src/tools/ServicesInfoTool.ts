import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { PrismaClient } from "@prisma/client";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const prisma = new PrismaClient();
const deepSeekModel = new ChatDeepSeek({
  apiKey: process.env["DEEPSEEK_API_KEY"]!,
  model: "deepseek-chat",
});

export const ServicesInfoTool = new DynamicStructuredTool({
  name: "services_info",
  description: "Given an English text, determines the desired service category using AI and returns the service details from the database.",
  schema: z.object({
    text: z.string().describe("English text describing the desired service"),
  }) as unknown as ToolInputSchemaBase,

  func: async ({ text }: { text: string }) => {
    // Fetch all services from the database
    const services = await prisma.services.findMany();
    const systemMessageTemplate = ChatPromptTemplate.fromTemplate(`Given the following services: {categories}
Which service best matches the user request: {text}? Reply with the category.`);

    const prompt = await systemMessageTemplate.formatPromptValue({
      categories: services.map(s => s.category).join("|"),
      text
    });
    const response = await deepSeekModel.invoke(prompt.messages);
    const selectedCategory = response.content.toString().trim();

    // Function to remove confidential fields
    const omitFields = (obj: any, fields: string[]) => {
      const result = { ...obj };
      fields.forEach(field => delete result[field]);
      Object.keys(result).forEach(key => (result[key] === null || result[key] === undefined) && delete result[key]);
      delete result["confidentiality"];
      return result;
    };

    // Find the selected service or prepare a fallback
    const selectedServices = services.filter(s => s.category === selectedCategory);

    if (selectedServices.length === 0) {
      return "No services found for the selected category.";
    }

    return JSON.stringify(selectedServices.map(service => {
      const combinedOmit = Array.from(new Set([...(service.confidentiality || [])]));
      const filtered = omitFields(service, combinedOmit);
      return filtered;
    }), null, 2);
  }
});