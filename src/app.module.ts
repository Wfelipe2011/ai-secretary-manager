import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIService } from './ia/open-ai.service';
import { SalesPromptService } from './ia/prompt.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, OpenAIService, SalesPromptService],
})
export class AppModule {}
