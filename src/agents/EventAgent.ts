// src/agents/EventAgent.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatDeepSeek } from "@langchain/deepseek";
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { DateTimeParserTool } from '../tools/DateTimeParserTool';
import { ScheduleCreateTool } from '../tools/ScheduleCreateTool';
import { ServicesInfoTool } from '../tools/ServicesInfoTool';
import { TranslationTool } from '../tools/TranslationTool';
import { UserInfoTool } from '../tools/UserInfoTool';
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
    static createAgent(): AgentExecutor {
        const model = new ChatDeepSeek({
            apiKey: process.env['DEEPSEEK_API_KEY']!,
            model: 'deepseek-chat',
        });

        const tools = [
            UserInfoTool,
            TranslationTool,
            ServicesInfoTool,
            DateTimeParserTool,
            ScheduleCreateTool
        ];

        const systemPrompt = `
        You are a customer service agent.\
        Available functions: ${tools.map((t) => t.name).join(', ')}.\
        When you receive an input, first translate it from Portuguese to English.\
        Think step by step about which function to call and with which parameters (in English).\
        Call the function and then translate the result back to Portuguese`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);

        const agent = createToolCallingAgent({
            llm: model,
            tools,
            prompt,
        });

        return new AgentExecutor({
            agent,
            tools,
            verbose: false,
        });

    }
}
