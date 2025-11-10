import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipResponse } from './common/decorators/skip-response.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @SkipResponse()
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return this.appService.getHello();
  }
}
