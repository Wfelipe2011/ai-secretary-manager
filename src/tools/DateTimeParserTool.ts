import { ToolInputSchemaBase } from '@langchain/core/dist/tools/types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import chrono from 'chrono-node';
import dayjs from 'dayjs';
import { z } from "zod";

/**
 * Ferramenta simplificada de análise de data/hora usando chrono-node.
 * - Analisa texto em inglês para datas e horários.
 * - Retorna uma string no formato ISO8601 ou null.
 */
export const DateTimeParserTool = new DynamicStructuredTool({
  name: "datetime_parser",
  description: "Extracts dates from English text with time period handling. Returns ISO8601 string or null",
  schema: z.object({
    text: z.string().describe("English text containing a time reference"),
  }) as unknown as ToolInputSchemaBase,
  func: async ({ text }: { text: string }): Promise<string> => {

    const refDate = dayjs().toDate();
    const results = chrono.casual.clone().parse(text, refDate, { forwardDate: true });
    if (!results.length || !results[0] || !results[0].start) {
      return JSON.stringify(null)
    }

    const start = results[0].start;
    const date = dayjs(start.date()).toDate();
    return date.toISOString()
  }
})
