// src/tools/business-hours-tool.ts
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

export class BusinessHoursTool extends StructuredTool {
  name = "business_hours_check";
  description = "Verifica se um horário está dentro do funcionamento (seg-sex, 9h-18h)";

  schema = z.object({
    date: z.string().describe("Data em ISO8601")
  });
  
  async _call({ date }: z.infer<typeof this.schema>) {
    const d = new Date(date);
    const day = d.getDay(); // 0-6 (dom-sab)
    const hour = d.getHours();
    
    const isValid = day >= 1 && day <= 5 && hour >= 9 && hour < 18;
    return JSON.stringify({ 
      isValid,
      message: isValid ? "" : "Fora do horário comercial (seg-sex, 9h-18h)"
    });
  }
}