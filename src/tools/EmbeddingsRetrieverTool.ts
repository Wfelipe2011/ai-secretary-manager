import "dotenv/config";
import {
    PGVectorStore,
    DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
});

// Configuração de exemplo
const config = {
    postgresConnectionOptions: {
        type: "postgres",
        host: process.env.PG_HOST,
        port: 5494,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
    } as PoolConfig,
    tableName: "DocumentVector",
    columns: {
        idColumnName: "id",
        vectorColumnName: "vector",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    },
    // Estratégias de distância suportadas: cosine (padrão), innerProduct ou euclidean
    distanceStrategy: "cosine" as DistanceStrategy,
};

async function main() {
    const vectorStore = await PGVectorStore.initialize(embeddings, config);

    const agendamentos: Document[] = [
        { pageContent: "Consulta com Dr. João às 10h na segunda-feira", metadata: { userId: "user1" } },
        { pageContent: "Reunião com equipe de vendas às 14h na terça", metadata: { userId: "user1" } },
        { pageContent: "Aula de yoga às 8h na quarta", metadata: { userId: "user1" } },
        { pageContent: "Dentista às 16h na quinta-feira", metadata: { userId: "user2" } },
        { pageContent: "Almoço com cliente no restaurante B às 13h", metadata: { userId: "user2" } },
        { pageContent: "Sessão de fisioterapia às 9h na sexta", metadata: { userId: "user2" } },
        { pageContent: "Webinar sobre inteligência artificial às 19h", metadata: { userId: "user3" } },
        { pageContent: "Treinamento de equipe às 11h na segunda", metadata: { userId: "user3" } },
        { pageContent: "Mentoria com líder de produto às 17h", metadata: { userId: "user3" } },
        { pageContent: "Check-up médico completo às 7h", metadata: { userId: "user3" } },
    ];

    const ids = agendamentos.map(() => uuidv4());

    // await vectorStore.addDocuments(agendamentos, { ids });

    const perguntas = [
        { userId: "user1", query: "Quais compromissos tenho na quarta-feira?" },
        { userId: "user2", query: "Tenho consulta médica marcada?" },
        { userId: "user3", query: "Quando é o webinar sobre IA?" },
    ];

    for (const pergunta of perguntas) {
        const retriever = vectorStore.asRetriever({
            filter: { userId: pergunta.userId },
            k: 2,
        });

        const result = await retriever.invoke(pergunta.query);
        console.log(`\n--- Resultados para ${pergunta.userId} ---`);
        console.log(result.map((doc) => doc.pageContent).join("\n"));
    }
}

main()
// const id4 = ids[ids.length - 1];

// await vectorStore.delete({ ids: [id4] });