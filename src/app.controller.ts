import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Gekko Server API is running',
      docs: '/api/docs',
      health: '/api/v1/health',
    };
  }
}
