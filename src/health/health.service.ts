import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      message: 'Gekko server is healthy',
      data: {
        status: 'ok',
        environment: this.configService.getOrThrow<string>('nodeEnv'),
      },
    };
  }
}