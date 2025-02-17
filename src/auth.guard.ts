// auth.guard.ts
import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenService } from './services/TokenService';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const tokens = this.tokenService.getTokens();

        if (!tokens || !tokens.accessToken) {
            return false; // Token não encontrado, bloqueia acesso
        }

        request['accessToken'] = tokens.accessToken; // Injetando o token na requisição
        return true; // Permite acesso
    }
}
