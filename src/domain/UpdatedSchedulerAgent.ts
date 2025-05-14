// src/agents/updated-scheduler-agent.ts
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SmartDateTimeTool } from "../tools/SmartDateTimeTool";
import { ServiceDurationTool } from "../tools/ServiceDurationTool";
import { BusinessHoursTool } from "../tools/BusinessHoursTool";
import { OnModuleInit } from "@nestjs/common";

export class UpdatedSchedulerAgent implements OnModuleInit {
  private executor: AgentExecutor;

  constructor() {

  }

  async onModuleInit() {
    await this.initializeAgent();
  }

  private async initializeAgent() {
    const tools = [
      new SmartDateTimeTool(),
      new ServiceDurationTool(),
      new BusinessHoursTool()
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `Você é um assistente de agendamento para barbearia. Siga estas regras:
  
        1. Extraia do texto:
          - Serviço (Corte, Barba ou Corte+Barba)
          - Data/hora (usar smart_datetime_parser)
          - Se não tiver hora, assuma a próxima disponível

        2. Calcule duração (service_duration)
        
        3. Verifique horário comercial (business_hours_check)
        
        4. Se faltar algo, pergunte especificamente o que falta
        
        5. Confirme todos os dados antes de criar`],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = await createOpenAIToolsAgent({
      llm: new ChatOpenAI({ model: "o4-mini", apiKey: process.env.OPENAI_API_KEY, }),
      tools,
      prompt
    });

    this.executor = new AgentExecutor({
      agent,
      tools,
      verbose: true
    });
  }

  public async scheduleAppointment(input: string) {
    return this.executor.invoke({ input });
  }
}