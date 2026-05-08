import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { LoginDTO } from './dto/login.dto';
import { HashService } from '../hash/hash.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly jwt: JwtService
    ) { }
    async login(data: LoginDTO) {

        const hash = await this.hashService.hash(data.password);

        const user = await this.prisma.user.findFirst({
            where: {
                username: data.username
            }
        })
        if (!user) {
            throw new UnauthorizedException;
        }

        const validateHash = await this.hashService.validateHash(data.password, user!.hash)


        if (!validateHash) { throw new UnauthorizedException };

        const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email })
        const payload = {
            sub: user.id,
            email: user.email,
            access_token: access_token
        }
        return payload;
    }
}
