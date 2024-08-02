import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIService } from './ia/open-ai.service';
import { SalesPromptService } from './ia/prompt.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, OpenAIService, SalesPromptService],
})
export class AppModule {}
