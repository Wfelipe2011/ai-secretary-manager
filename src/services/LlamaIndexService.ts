import {
  RouterQueryEngine,
  VectorStoreIndex,
  SummaryIndex,
  Document,
  Settings,
  SentenceSplitter,
} from 'llamaindex';
import { Injectable } from '@nestjs/common';
import { OpenAI } from '@llamaindex/openai';

Settings.llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-3.5-turbo-0125', });
Settings.nodeParser = new SentenceSplitter({ chunkSize: 1024 });

@Injectable()
export class LlamaIndexService {
  private queryEngine: RouterQueryEngine | null = null;

  async buildQueryEngine(events: Array<{ id: string; titulo: string; descricao: string; dataHora: string; duracao: number }>) {
    const documents = events.map(
      (event) =>
        new Document({
          id_: event.id,
          text: `Compromisso: ${event.titulo}. Descrição: ${event.descricao || 'Sem descrição'}. Início: ${event.dataHora}. Duração: ${event.duracao} minutos.`,
        })
    );

    const vectorIndex = await VectorStoreIndex.fromDocuments(documents);
    const summaryIndex = await SummaryIndex.fromDocuments(documents);

    const vectorQueryEngine = vectorIndex.asQueryEngine();
    const summaryQueryEngine = summaryIndex.asQueryEngine();

    this.queryEngine = RouterQueryEngine.fromDefaults({
      queryEngineTools: [
        {
          queryEngine: vectorQueryEngine,
          description: 'Use para perguntas específicas sobre compromissos.',
        },
        {
          queryEngine: summaryQueryEngine,
          description: 'Use para resumos de compromissos agendados.',
        },
      ],
    });
  }

  async query(queryText: string) {
    if (!this.queryEngine) throw new Error('Query engine não foi inicializado.');
    const response = await this.queryEngine.query({ query: queryText });
    return response.response;
  }
}
