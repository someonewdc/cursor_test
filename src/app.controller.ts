import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): { ok: true } {
    return { ok: true };
  }
}
