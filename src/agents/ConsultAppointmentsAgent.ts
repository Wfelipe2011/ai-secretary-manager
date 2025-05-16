import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ToolSchemaBase } from "@langchain/core/tools";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Injectable, Logger } from "@nestjs/common";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { StructuredTool } from "langchain/tools";
import { StateAnnotation } from "src/graph/graph-state-annotation";
import { IAgent } from "../interface/agents.interface";

dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class ConsultAppointmentsAgent implements IAgent {
    name: string;
    logger: Logger;
    model: ChatDeepSeek;
    tools: StructuredTool<ToolSchemaBase, any, any, any>[];
    systemPrompt: string;
    executor: AgentExecutor;

    constructor() {
        this.name = "consult_appointments_agent";
        this.logger = new Logger(ConsultAppointmentsAgent.name);
        this.model = new ChatDeepSeek({
            apiKey: process.env["DEEPSEEK_API_KEY"]!,
            model: 'deepseek-chat',
        });
        this.tools = [];
        this.systemPrompt = `
        You are a customer service agent.
        Available functions: ${this.tools.map((t) => t.name).join(', ')}.
        When you receive an input, first translate it from Portuguese to English.
        Think step by step about which function to call and with which parameters (in English).
        Call the function and then translate the result back to Portuguese in a friendly tone.`;
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", this.systemPrompt],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);
        const agent = createToolCallingAgent({
            llm: this.model,
            tools: this.tools,
            prompt,
        });
        this.executor = new AgentExecutor({
            agent,
            tools: this.tools,
            verbose: true,
        });
    }

    async invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> {
        const inputMessage = state.messages[0]?.content ?? "";
        const response = await this.executor.invoke({
            input: inputMessage,
        })

        this.logger.log('Resposta recebida do modelo DeepSeek.');
        this.logger.debug('Conteúdo da resposta:', response["output"]);
        this.logger.log('Atualizando estado com nova mensagem...');
        state.messages.push(new AIMessage({ content: response["output"] }));

        return state;
    }
}