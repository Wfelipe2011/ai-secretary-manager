// refresh-token.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from './TokenService';

@Injectable()
export class RefreshTokenService {
    constructor(private tokenService: TokenService) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async refreshTokens() {
        const tokens = this.tokenService.getTokens();
        if (tokens && tokens.refreshToken) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            oauth2Client.setCredentials({
                refresh_token: tokens.refreshToken,
            });

            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                this.tokenService.setTokens({
                    accessToken: credentials.access_token,
                    refreshToken: tokens.refreshToken,
                });
                console.log('Token refreshed successfully');
            } catch (error) {
                console.error('Failed to refresh token', error);
            }
        }
    }
}
