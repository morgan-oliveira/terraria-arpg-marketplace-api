import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { LoginDTO } from './dto/login.dto';
import { HashService } from '../hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly jwt: JwtService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
    ) { }
    async login(data: LoginDTO, ip?: string) {
        try {
            this.logger.info('Login attempt started', {
                context: AuthService.name,
                username: data.username,
                ip,
            });

            const user = await this.prisma.user.findFirst({
                where: {
                    username: data.username
                }
            })
            if (!user) {
                this.logger.warn('Login failed: user not found', {
                    context: AuthService.name,
                    username: data.username,
                    ip,
                });
                throw new UnauthorizedException('Invalid username or password');
            }

            const validateHash = await this.hashService.validateHash(data.password, user!.hash)


            if (!validateHash) {
                this.logger.warn('Login failed: invalid password', {
                    context: AuthService.name,
                    userId: user.id,
                    username: data.username,
                    ip,
                });
                throw new UnauthorizedException('Invalid username or password')
            };

            const access_token = await this.jwt.signAsync({ sub: user.id, email: user.email })
            const payload = {
                sub: user.id,
                email: user.email,
                access_token: access_token
            }
            this.logger.info('Login succeeded', {
                context: AuthService.name,
                userId: user.id,
                username: data.username,
                ip,
            });
            return payload;
        } catch (error) {
            if (!(error instanceof UnauthorizedException)) {
                this.logger.error('Login failed unexpectedly', {
                    context: AuthService.name,
                    username: data.username,
                    ip,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            handlePrismaError(error, 'Could not login');
        }
    }
}
