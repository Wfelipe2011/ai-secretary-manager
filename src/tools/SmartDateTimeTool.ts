import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import * as chrono from 'chrono-node';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Ferramenta simplificada de análise de data/hora usando chrono-node.
 * - Analisa texto em inglês para datas e horários.
 * - Aplica períodos de tempo padrão: manhã (6–12), tarde (12–18), noite (18–22), madrugada (22–6).
 * - Retorna uma string no formato ISO8601 ou null.
 */
export class SmartDateTimeTool extends StructuredTool {
  name = "smart_datetime_parser";
  description = "Extracts dates from English text with time period handling. Returns ISO8601 string or null using America/Sao_Paulo timezone.";

  schema = z.object({
    text: z.string().describe("Texto em inglês contendo referência de tempo"),
  });

  async _call({ text }: { text: string }): Promise<string> {
    // Data de referência: agora
    const refDate = dayjs().tz("America/Sao_Paulo").toDate();
    // Clonar o analisador casual
    const results = chrono.casual.clone().parse(text, refDate, { forwardDate: true });

    if (!results.length) {
      return JSON.stringify({ date: null, originalText: text });
    }

    const start = results[0].start;

    const parsedDateISO = dayjs(start.date()).tz('America/Sao_Paulo').format();
    // Se nenhum horário específico for fornecido, o chrono usa o padrão 12:00. Você pode ajustar com base em palavras-chave de período.
    return JSON.stringify({
      date: parsedDateISO,
      originalText: text,
      parsedText: results[0].text
    });
  }
}
