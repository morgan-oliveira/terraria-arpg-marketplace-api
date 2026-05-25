import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { LoginDTO } from './dto/login.dto';
import { HashService } from '../hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly jwt: JwtService
    ) { }
    async login(data: LoginDTO) {
        try {

            const user = await this.prisma.user.findFirst({
                where: {
                    username: data.username
                }
            })
            if (!user) {
                throw new UnauthorizedException('Invalid username or password');
            }

            const validateHash = await this.hashService.validateHash(data.password, user!.hash)


            if (!validateHash) { throw new UnauthorizedException('Invalid username or password') };

            const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email })
            const payload = {
                sub: user.id,
                email: user.email,
                access_token: access_token
            }
            return payload;
        } catch (error) {
            handlePrismaError(error, 'Could not login');
        }
    }
}
