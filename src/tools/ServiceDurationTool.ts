// src/tools/service-duration-tool.ts
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

export class ServiceDurationTool extends StructuredTool {
  name = "service_duration";
  description = "Retorna a duração do serviço em minutos";

  schema = z.object({
    service: z.enum(["Corte de cabelo", "Barba", "Corte e Barba"])
  });

  async _call({ service }: z.infer<typeof this.schema>) {
    const durations = {
      "Corte de cabelo": 30,
      "Barba": 30,
      "Corte e Barba": 60
    };
    return JSON.stringify({ duration: durations[service] });
  }
}