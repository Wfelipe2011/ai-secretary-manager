import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const prisma = new PrismaClient();
const deepSeekModel = new ChatDeepSeek({
  apiKey: process.env["DEEPSEEK_API_KEY"]!,
  model: "deepseek-chat",
});

const logger = new Logger("ServicesInfoTool");




export const ServicesInfoTool = new DynamicStructuredTool({
  name: "services_info",
  description: "Given an English text, determines the desired service category using AI and returns the service details from the database.",
  schema: z.object({
    text: z.string().describe("English text describing the desired service"),
  }) as unknown as ToolInputSchemaBase,

  func: async ({ text }: { text: string }) => {
    logger.debug(`Determinando a categoria do serviço para o texto: ${text}`);
    const services = await prisma.services.findMany();
    const categories = services.map(s => s.category);
    logger.debug(`Categorias de serviços disponíveis: ${JSON.stringify(categories)}`);

    const systemMessageTemplate = ChatPromptTemplate.fromTemplate(`Given the following services: {categories}
Which service best matches the user request: {text}? Reply with the category.`);

    const prompt = await systemMessageTemplate.invoke({
      categories: services.map(s => s.category).join("|"),
      text
    });

    const categorySchema = z.object({
      category: z.enum(categories as [string, ...string[]]),
    });

    const categoryModel = deepSeekModel.withStructuredOutput(categorySchema, {
      name: "extractor",
    });

    const response = await categoryModel.invoke(prompt.messages);
    logger.debug(`Resposta do modelo de categorização: ${JSON.stringify(response, null, 2)}`);
    const selectedCategory = response['category'];
    logger.debug(`Categoria de serviço selecionada: ${selectedCategory}`);


    const omitFields = (obj: any, fields: string[]) => {
      const result = { ...obj };
      fields.forEach(field => delete result[field]);
      Object.keys(result).forEach(key => (result[key] === null || result[key] === undefined) && delete result[key]);
      delete result["confidentiality"];
      return result;
    };

    // Find the selected service or prepare a fallback
    const selectedServices = services.filter(s => {
      console.log(`Comparando ${s.category} com ${selectedCategory}`);
      return s.category.trim() == selectedCategory.trim();
    });
    if (selectedServices.length === 0) {
      return "No services found for the selected category.";
    }

    return JSON.stringify(selectedServices.map(service => {
      const combinedOmit = Array.from(new Set([...(service.confidentiality || [])]));
      const filtered = omitFields(service, combinedOmit);
      return {
        ...filtered,
        duration: +service.duration.toString(),
      };
    }), null, 2);
  }
});