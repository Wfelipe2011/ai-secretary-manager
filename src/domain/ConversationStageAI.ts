import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OpenAIService } from 'src/ia/open-ai.service';
import { ConversationStage } from 'src/enum/ConversationStage';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

const conversationStageSchema = z.object({
  etapa: z.enum(Object.values(ConversationStage) as [ConversationStage, ...ConversationStage[]]).describe('Conversation stage'),
});

export class ConversationStageAI {
  constructor(private openAIService: OpenAIService) { }

  async classifyStage(message: string): Promise<ConversationStage> {
    const taggingPrompt = ChatPromptTemplate.fromTemplate(
      `Classify the conversation stage.
      Message:
        {message}
      `,
    );

    const llmWithStructuredOutput = this.openAIService.llm.withStructuredOutput(conversationStageSchema, {
      name: 'stage_extractor',
    });

    const prompt = await taggingPrompt.invoke({ message });
    const result = await llmWithStructuredOutput.invoke(prompt);

    return result.etapa! || ConversationStage.NAO_ENTENDI;
  }
}
