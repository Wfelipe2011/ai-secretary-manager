import { AgentExecutor } from 'langchain/agents';
import { SmartDateTimeTool } from '../tools/DateTimeParserTool';
import { CreateEventTool } from '../tools/UserInfoTool';
import { EventAgent } from './EventAgent';

// jest timeout 30 segundos
jest.setTimeout(30000);

describe('EventAgent Integration', () => {
    let mockPrisma: { schedule: { create: jest.Mock } };
    let agent: AgentExecutor;

    beforeEach(async () => {
        mockPrisma = { schedule: { create: jest.fn() } };
        agent = await EventAgent.createAgent(mockPrisma as any);
    });

    test('deve incluir SmartDateTimeTool e CreateEventTool nas ferramentas do agente', () => {
        const toolNames = agent.tools.map(t => t.name);
        expect(toolNames).toContain(new SmartDateTimeTool().name);
        expect(toolNames).toContain(new CreateEventTool(mockPrisma as any).name);
    });

    test('deve criar um evento a partir de uma entrada em linguagem natural', async () => {
        const input = 'Agendar demonstração para 2025-06-01 das 10h às 11h';
        const result = await agent._call({ input });

        // mensagem final em português
        expect(result.output).toMatch(/sucesso|agendada/i);
        // o método do prisma deve ser chamado
        expect(mockPrisma.schedule.create).toHaveBeenCalledTimes(1);
    });

    test('não deve criar um evento quando a entrada não for relacionada', async () => {
        const input = 'Como está o tempo hoje?';
        const result = await agent._call({ input });

        // não deve criar nada no banco
        expect(mockPrisma.schedule.create).not.toHaveBeenCalled();
    });
});
