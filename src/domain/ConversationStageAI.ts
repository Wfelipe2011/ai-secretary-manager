import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OpenAIService } from 'src/ia/open-ai.service';
import { ConversationStage } from 'src/enum/ConversationStage';

const conversationStageSchema = z.object({
    etapa: z.enum(Object.values(ConversationStage) as [ConversationStage, ...ConversationStage[]]).describe('Conversation stage'),
});

export class ConversationStageAI {
    constructor(private openAIService: OpenAIService) { }

    async classifyStage(message: string, context: string = ''): Promise<ConversationStage> {
        const taggingPrompt = ChatPromptTemplate.fromTemplate(
            `Classify the conversation stage.
      Context:
        {context}
      Message:
        {message}
      `,
        );

        const llmWithStructuredOutput = this.openAIService.llm.withStructuredOutput(conversationStageSchema, {
            name: 'stage_extractor',
        });

        const prompt = await taggingPrompt.invoke({ message, context });
        const result = await llmWithStructuredOutput.invoke(prompt);

        return result.etapa! || ConversationStage.NAO_ENTENDI;
    }
}
