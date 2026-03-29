import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDTO } from './dto/login.dto';
import { BcryptService } from './bcrypt/bcrypt.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly bycrypt: BcryptService
    ) {}
    async login(data: LoginDTO) {
        // login
    }
}
