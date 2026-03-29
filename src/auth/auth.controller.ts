import { Body, Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { CreateUserDTO } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(@Body() data: LoginDTO): Promise<any> {
    await this.authService.login(data);
  }
}
