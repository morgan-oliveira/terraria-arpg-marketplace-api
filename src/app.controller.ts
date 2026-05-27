import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Verifica se o servidor esta online.' })
  @ApiResponse({ status: 200, description: 'Servidor online. Retorna status, uptime e timestamp.' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Post()
  @ApiOperation({ summary: 'Cria um registro de teste no banco.' })
  @ApiResponse({ status: 201, description: 'Registro de teste criado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 409, description: 'Registro de teste ja existe.' })
  async getHello() {
    return this.appService.getHello();
  }
}
