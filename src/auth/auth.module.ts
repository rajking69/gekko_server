import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';
import { DatabaseModule } from '../database/database.module.js';
import { BETTER_AUTH_TOKEN } from './guards/auth.guard.ts';

// Type extensions
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      image?: string;
    }
  }
}

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: BETTER_AUTH_TOKEN,
      useFactory: (configService: ConfigService) => {
        const mongoUri: string = configService.getOrThrow<string>('mongodbUri');
        const frontendUrl: string = configService.getOrThrow<string>('frontendUrl');
        const port: number = configService.get<number>('port') || 5000;
        const baseURL: string = process.env.BETTER_AUTH_URL || `http://localhost:${port}/api/v1/auth`;
        
        const client = new MongoClient(mongoUri);
        const db = client.db('Team_Gekko');
        
        return betterAuth({
          database: mongodbAdapter(db, { client }),
          
          // Email/password authentication (required for Phase 2)
          emailAndPassword: {
            enabled: true,
          },
          
          // Social providers configuration
          socialProviders: {
            google: {
              clientId: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
              clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            },
          },
          
          // Base URL for auth routes
          baseURL,
          
          // Cookie security options for production
          cookieSameSite: 'lax',
          cookieSecure: false,
          trustedOrigins: [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [BETTER_AUTH_TOKEN],
})
export class AuthModule {}
