import { FuncionalStage } from 'src/enum/ConversationStage';
import { OpenAIService } from 'src/ia/open-ai.service';

export class GreetingAI {
    private openAIService: OpenAIService;

    constructor(openAIService: OpenAIService) {
        this.openAIService = openAIService;
    }

    async greetUser(message: string) {
        // Pega os valores do enum dinamicamente
        const stages = Object.values(FuncionalStage);

        // Instrução para a IA gerar uma saudação natural baseada nessas etapas
        const instruction = `
        Você é um especialista de atendimento com foco em agendamento.
        - As suas funcionalidades são as seguintes: ${stages.join(', ')}.
        Se apresente ofereça ajuda e se necessário apresente a lista de forma humanizada(sem usar o stage diretamente) e finalize com uma pergunta convidando o usuário a interagir.
        Exemplo: 
        User: Olá!
        IA:👋 Olá! Eu sou o Nathan, seu assistente de agendamentos. 📅
                Estou aqui para te ajudar a marcar compromissos de forma simples e rápida.
                💡 Como posso te ajudar hoje? Quer agendar algo? 😊
        
        Agora é a sua vez.
        User: ${message} 
        IA: 
        `;

        // Envia o texto para o LLM gerar a saudação
        const response = await this.openAIService.llm.invoke(instruction);
        return response.content;
    }
}
