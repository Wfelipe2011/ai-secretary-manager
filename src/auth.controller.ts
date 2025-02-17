// auth.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './services/AuthService';
import { google } from 'googleapis';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    googleAuth() {
        // Redireciona o usuário para o Google para login
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL,
        );

        const url = oauth2Client.generateAuthUrl({
            prompt: 'consent',
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar'], // Defina os escopos necessários
        });

        return { url }; // Pode redirecionar o usuário para essa URL ou apenas retornar a URL para o front-end
    }

    @Get('/callback')
    async googleCallback(@Query('code') code: string) {
        const tokens = await this.authService.googleLogin(code);
        return { message: 'Login successful', tokens };
    }
}
