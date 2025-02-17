import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIService } from './ia/open-ai.service';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleStrategy } from './services/GoogleStrategy';
import { RefreshTokenService } from './services/RefreshTokenService';
import { TokenService } from './services/TokenService';
import { AuthTokenMiddleware } from './auth-token.middleware';
import { CalendarController } from './calendar.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './services/AuthService';
import { GoogleCalendarService } from './services/GoogleCalendarService';
import { LlamaIndexService } from './services/LlamaIndexService';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [AppController, CalendarController, AuthController],
  providers: [AppService, OpenAIService, GoogleStrategy, TokenService, RefreshTokenService, AuthService, GoogleCalendarService, LlamaIndexService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthTokenMiddleware).forRoutes('*'); // Aqui você define as rotas onde precisa do token
  }
}
