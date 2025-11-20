import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * 系统健康检查
   * GET /health
   */
  @Public()
  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }
}
