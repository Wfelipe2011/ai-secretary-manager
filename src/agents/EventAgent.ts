// src/agents/EventAgent.ts
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { SmartDateTimeTool } from '../tools/SmartDateTimeTool';
import { CreateEventTool } from '../tools/CreateEventTool';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { ChatDeepSeek } from "@langchain/deepseek";
// ChatDeepSeek 
// deepseek-chat
/**
 * Agente de atendimento que utiliza as tools disponíveis.
 * Fluxo:
 * 1. Recebe input em português.
 * 2. Traduz para inglês.
 * 3. Pensa passo a passo (chain-of-thought).
 * 4. Chama a tool apropriada com argumentos em inglês.
 * 5. Retorna resposta amigável em português.
 */
export class EventAgent {
    static async createAgent(prismaService?: PrismaService): Promise<AgentExecutor> {
        const model = new ChatDeepSeek({
            apiKey: process.env.DEEPSEEK_API_KEY,
            model: 'deepseek-chat',
        });

        const tools = [
            new SmartDateTimeTool(),
            new CreateEventTool(prismaService),
        ];

        const systemPrompt = `
        You are a customer service agent.\
        Available functions: ${tools.map((t) => t.name).join(', ')}.\
        When you receive an input, first translate it from Portuguese to English.\
        Think step by step about which function to call and with which parameters (in English).\
        Call the function and then translate the result back to Portuguese in a friendly tone.`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);

        const agent = await createToolCallingAgent({
            llm: model,
            tools,
            prompt,
        });

        return new AgentExecutor({
            agent,
            tools,
            verbose: true,
        });

    }
}
