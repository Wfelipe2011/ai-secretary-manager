import { Injectable } from '@nestjs/common';
import { OpenAIService } from './ia/open-ai.service';
import { SalesPromptService } from './ia/prompt.service';

export const CONVERSATION_STAGES = [
  'Introdução: Comece a conversa se apresentando e apresentando sua empresa. Seja educado e respeitoso enquanto mantém o tom da conversa profissional. Sua saudação deve ser acolhedora.',
  'Análise de necessidades: Faça perguntas abertas para descobrir as necessidades e pontos problemáticos do prospecto. Ouça atentamente às respostas e tome notas.',
  'Proposta de valor: Explique brevemente como seu produto/serviço pode beneficiar o prospecto. Foque nos pontos de venda exclusivos e na proposta de valor do seu produto/serviço que o diferencia dos concorrentes.',
  'Apresentação da solução: Com base nas necessidades do prospecto, apresente seu produto/serviço como a solução que pode resolver seus pontos problemáticos.',
  'Lidar com objeções: Aborde quaisquer objeções que o prospecto possa ter em relação ao seu produto/serviço. Esteja preparado para fornecer evidências ou depoimentos para apoiar suas afirmações.',
  'Fechamento: Peça pela venda propondo um próximo passo. Certifique-se de resumir o que foi discutido e informar o valor total do pedido',
  'Encerrar conversa: É hora de encerrar a ligação, pois não há mais nada a ser dito.',
  'Ajuda: Se o cliente pedir mais informações que você não tem, você pode pedir avisar que irá passar a conversa para o supervisor e ele entrará em contato com o cliente, É hora de encerrar a conversa, pois não há mais nada a ser dito.',
  'Desvio do assunto: Se o cliente começar a falar sobre algo que não está relacionado ao produto, você tentará trazer a conversa de volta ao assunto principal. Se o cliente continuar desviando o assunto, você pode encerrar a conversa.',
];

const personaIA = {
  role: 'assistente de vendas',
  agent: 'agente de vendas',
  conversation: 'conversa de vendas',
  stagesNumberMax: CONVERSATION_STAGES.length,
};

const personaConversation = {
  salesperson_name: 'Joana Silva',
  salesperson_role: 'vendedor',
  company: {
    name: 'Limpeza Total',
    business: 'venda de produtos de limpeza',
    values: 'qualidade, inovação, sustentabilidade',
    supervisor: {
      name: 'Wilson Felipe',
      role: 'gerente de vendas',
      phone: '(15) 981785706',
      personalInfo: {
        age: 28,
        bio: 'Wilson Felipe é um gerente de vendas experiente com mais de 5 anos de experiência no setor. Ele é conhecido por sua abordagem estratégica e sua capacidade de motivar sua equipe para alcançar resultados excepcionais.',
        strengths: 'liderança, inovação, negociação',
      },
    },
    products: [
      {
        name: 'Veja Multiuso',
        description:
          'Veja Multiuso é um produto de limpeza versátil que pode ser usado em várias superfícies. Ele é eficaz na remoção de sua sujeira e gordura, deixando as superfícies limpas e brilhantes.',
        benefits: 'Veja Multiuso é econômico e fácil de usar, tornando-o ideal para uso doméstico e comercial.',
        price: 19.99,
        priority: 'alto',
      },
      {
        name: 'Pinho Sol',
        description:
          'Pinho Sol é um desinfetante poderoso que mata germes e bactérias. Ele deixa um aroma fresco e agradável após a limpeza, tornando-o ideal para uso em banheiros e cozinhas.',
        benefits: 'Pinho Sol é eficaz na eliminação de odores desagradáveis e na desinfecção de superfícies.',
        price: 9.39,
        priority: 'médio',
      },
      {
        name: 'Cif Vidros',
        description:
          'Cif Vidros é um limpador de vidros especial que remove manchas e sujeira sem deixar resíduos. Ele deixa as superfícies limpas e transparentes, proporcionando uma aparência impecável.',
        benefits: 'Cif Vidros é fácil de usar e proporciona resultados brilhantes em vidros e espelhos.',
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
  private context: Array<{ key: string; user: string; ia?: string }> = [];

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly promptService: SalesPromptService,
  ) {}

  ctxByKey(key: string) {
    return this.context.filter((c) => c.key === key);
  }

  async chat(message: string, key: string): Promise<string> {
    this.context.push({ user: message, key });

    const prompt = this.promptService.createStageAnalyzerPrompt({
      ...personaIA,
      stages: CONVERSATION_STAGES,
    });
    const chain = prompt.pipe(this.openAIService.getModel());

    const context = this.ctxByKey(key)
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
            return `${index + 1}. Produto: ${p.name}, Preço: ${p.price}, Descrição: ${p.description}, Benefícios: ${p.benefits}, Prioridade Confidencial(${p.priority})`;
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

    this.ctxByKey(key).find((m) => !m.ia).ia = res.content as string;
    return res.content as string;
  }
}
