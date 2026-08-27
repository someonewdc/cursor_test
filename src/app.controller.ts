import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('home')
  getHome() {
    return {};
  }

  @Get('health')
  getHealth(): { ok: true } {
    return { ok: true };
  }
}
