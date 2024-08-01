import { Injectable } from '@nestjs/common';
import { OpenAIService } from './ia/open-ai.service';
import { SalesPromptService } from './ia/prompt.service';

export const CONVERSATION_STAGES = [
  'Introdução: Comece a conversa se apresentando e apresentando sua empresa. Seja educado e respeitoso enquanto mantém o tom da conversa profissional. Sua saudação deve ser acolhedora.',
  'Análise de necessidades: Faça perguntas abertas para descobrir as necessidades e pontos problemáticos do prospecto. Ouça atentamente às respostas e tome notas.',
  'Proposta de valor: Explique brevemente como seu produto/serviço pode beneficiar o prospecto. Foque nos pontos de venda exclusivos e na proposta de valor do seu produto/serviço que o diferencia dos concorrentes.',
  'Apresentação da solução: Com base nas necessidades do prospecto, apresente seu produto/serviço como a solução que pode resolver seus pontos problemáticos.',
  'Lidar com objeções: Aborde quaisquer objeções que o prospecto possa ter em relação ao seu produto/serviço. Esteja preparado para fornecer evidências ou depoimentos para apoiar suas afirmações.',
  'Fechamento: Peça pela venda propondo um próximo passo. Isso pode ser uma demonstração, um teste ou uma reunião com os tomadores de decisão. Certifique-se de resumir o que foi discutido e reiterar os benefícios.',
  'Encerrar conversa: É hora de encerrar a ligação, pois não há mais nada a ser dito.',
  'Ajuda: Se o cliente pedir mais informações que você não tem, você pode pedir avisar que irá passar a conversa para o supervisor e ele entrará em contato com o cliente, É hora de encerrar a conversa, pois não há mais nada a ser dito..',
];

const personaIA = {
  role: 'assistente de vendas',
  agent: 'agente de vendas',
  conversation: 'conversa de vendas',
  stagesNumberMax: CONVERSATION_STAGES.length,
};

const personaConversation = {
  salesperson_name: 'John Doe',
  salesperson_role: 'vendedor',
  company: {
    name: 'Exemplo S.A.',
    business: 'venda de produtos de limpeza',
    values: 'qualidade, inovação, sustentabilidade',
    supervisor: {
      name: 'João Silva',
      role: 'gerente de vendas',
      phone: '(11) 99999-9999',
      personalInfo: {
        age: 35,
        bio: 'João é um gerente de vendas experiente com mais de 10 anos de experiência no setor. Ele é conhecido por sua abordagem orientada a resultados e por sua capacidade de motivar sua equipe a alcançar metas desafiadoras.',
        strengths: 'liderança, comunicação, negociação',
      },
    },
    products: [
      {
        name: 'produto 1',
        description:
          'produto 1 é um produto de limpeza multiuso que pode ser usado em várias superfícies. Ele é eficaz na remoção de manchas e sujeira, deixando as superfícies limpas e brilhantes.',
        benefits: 'produto 1 é econômico, fácil de usar e seguro para o meio ambiente.',
        price: 19.99,
        priority: 'alto',
      },
      {
        name: 'produto 2',
        description:
          'produto 2 é um desinfetante poderoso que mata 99,9% dos germes e bactérias. Ele é ideal para uso em banheiros, cozinhas e outras áreas de alto tráfego.',
        benefits: 'produto 2 é eficaz na eliminação de germes e bactérias, deixando as superfícies limpas e seguras.',
        price: 24.99,
        priority: 'médio',
      },
      {
        name: 'produto 3',
        description:
          'produto 3 é um limpador de vidros que deixa as janelas e espelhos brilhantes e sem manchas. Ele é ideal para uso em residências e escritórios.',
        benefits: 'produto 3 é eficaz na remoção de manchas e sujeira, deixando as superfícies limpas e transparentes.',
        price: 14.99,
        priority: 'baixo',
      },
    ],
  },
  conversation_purpose: 'oferecer um novo produto',
  conversation_type: 'whatsapp',
};
@Injectable()
export class AppService {
  private context: Array<{ user: string; ia?: string }> = [];

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly promptService: SalesPromptService,
  ) {}

  async chat(message: string): Promise<string> {
    this.context.push({ user: message });

    const prompt = this.promptService.createStageAnalyzerPrompt({
      ...personaIA,
      stages: CONVERSATION_STAGES,
    });
    const chain = prompt.pipe(this.openAIService.getModel());

    const context = this.context
      .map((m) =>
        m?.ia
          ? `User: ${m.user}<END_OF_TURN>\n${personaConversation.salesperson_name}: ${m.ia}<END_OF_TURN>`
          : `User: ${m.user}<END_OF_TURN>`,
      )
      .join('\n');

    const response = await chain.invoke({ conversation_history: context });
    const stage = Number(response.content as string);

    const salesPrompt = this.promptService.createSalesConversationPrompt({
      ...personaConversation,
      company: {
        ...personaConversation.company,
        products: personaConversation.company.products
          .map((p, index) => {
            return `${index + 1}. Produto: ${p.name}, Preço: ${p.price}, Descrição: ${p.description}, Beneficions: ${p.benefits}, Prioridade Confidencial(${p.priority})`;
          })
          .join('/n'),
      },
      stages: CONVERSATION_STAGES,
    });
    const chatSales = salesPrompt.pipe(this.openAIService.getModel());

    const res = await chatSales.invoke({
      conversation_history: context,
      conversation_stage: CONVERSATION_STAGES[stage - 1],
    });

    this.context.find((m) => !m.ia).ia = res.content as string;
    return res.content as string;
  }
}
