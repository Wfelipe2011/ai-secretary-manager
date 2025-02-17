// token.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

const TOKEN_FILE_PATH = 'tokens.json';

@Injectable()
export class TokenService {
    private static readTokens() {
        if (!fs.existsSync(TOKEN_FILE_PATH)) {
            return null;
        }
        const rawData = fs.readFileSync(TOKEN_FILE_PATH).toString();
        return JSON.parse(rawData);
    }

    private static writeTokens(tokens: object) {
        fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens));
    }

    getTokens() {
        return TokenService.readTokens() as { accessToken: string, refreshToken: string };
    }

    setTokens(tokens: { accessToken: string, refreshToken: string }) {
        TokenService.writeTokens(tokens);
    }
}
