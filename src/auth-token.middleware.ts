// auth-token.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from './services/TokenService';

@Injectable()
export class AuthTokenMiddleware implements NestMiddleware {
    constructor(private tokenService: TokenService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const tokens = this.tokenService.getTokens();
        if (tokens && tokens.accessToken) {
            req['accessToken'] = tokens.accessToken; // Injetando o token no request
            next();
        } else {
            res.status(401).json({ message: 'Access Token not available' });
        }
    }
}
