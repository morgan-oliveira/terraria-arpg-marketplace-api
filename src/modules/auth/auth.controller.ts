import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Autentica usuario e retorna um access token JWT.' })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso. Retorna sub, email e access_token.' })
  @ApiResponse({ status: 401, description: 'Username ou senha invalidos.' })
  async login(@Body() data: LoginDTO, @Req() request: Request): Promise<any> {
    return await this.authService.login(data, request.ip);
  }
}
