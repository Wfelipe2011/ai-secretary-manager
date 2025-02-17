// auth.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { TokenService } from './TokenService';

@Injectable()
export class AuthService {
    constructor(private tokenService: TokenService) { }

    async googleLogin(code: string) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL,

        );

        // Trocar o código de autorização por tokens
        const res = await oauth2Client.getToken(code);
        const { tokens } = res;
        // Salvar os tokens no arquivo
        this.tokenService.setTokens({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });

        return res;
    }
}
