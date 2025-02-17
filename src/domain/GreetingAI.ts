import { FuncionalStage } from 'src/enum/ConversationStage';
import { OpenAIService } from 'src/ia/open-ai.service';

export class GreetingAI {
    private openAIService: OpenAIService;

    constructor(openAIService: OpenAIService) {
        this.openAIService = openAIService;
    }

    async greetUser(name: string) {
        // Pega os valores do enum dinamicamente
        const stages = Object.values(FuncionalStage);

        // Instrução para a IA gerar uma saudação natural baseada nessas etapas
        const instruction = `
        Olá, ${name}! 😊  
        Estou aqui para te ajudar.  
        Abaixo estão algumas das coisas que posso fazer por você:
    
        - As funcionalidades são as seguintes: ${stages.join(', ')}.
    
        Sua tarefa é transformar essas funcionalidades em uma lista com descrições naturais e compreensíveis para o usuário, sem mencionar os nomes técnicos.
        Use emojis para deixar a comunicação mais leve.
    
        Apresente a lista e finalize com uma pergunta convidando o usuário a interagir.
        `;

        // Envia o texto para o LLM gerar a saudação
        const response = await this.openAIService.llm.invoke(instruction);
        return response.content;
    }
}
