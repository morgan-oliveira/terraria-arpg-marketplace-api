import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../hash/hash.service';
import { createHmac, randomInt, randomUUID } from 'crypto';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { ResendService } from '../resend/resend.service';
import { ConfigService } from '@nestjs/config';
import { handlePrismaError } from '../../common/errors/prisma-error-handler';
import { AddCoinsDto } from './dto/add-coins.dto';
import { ModAuthService } from '../../common/services/mod-auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

type ResetPasswordTokenPayload = {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: string;
};

@Injectable()
export class UserService {
  private readonly publicUserSelect = {
    id: true,
    name: true,
    username: true,
    steamId: true,
    coins: true,
    items: {
      select: {
        id: true,
        name: true,
        price: true,
        itemData: true,
        status: true,
      },
    },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
    private readonly modAuthService: ModAuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) { }

  private generateOtp() {
    return randomInt(100000, 1000000).toString();
  }

  private getResetPasswordTokenSecret() {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private signResetPasswordTokenPayload(payload: string) {
    return createHmac('sha256', this.getResetPasswordTokenSecret()).update(payload).digest('base64url');
  }

  private createResetPasswordToken(payload: ResetPasswordTokenPayload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.signResetPasswordTokenPayload(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private parseResetPasswordToken(resetPasswordId: string) {
    const [encodedPayload, signature] = resetPasswordId.split('.');

    if (!encodedPayload || !signature || signature !== this.signResetPasswordTokenPayload(encodedPayload)) {
      throw new BadRequestException('Invalid reset password code');
    }

    try {
      return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as ResetPasswordTokenPayload;
    } catch {
      throw new BadRequestException('Invalid reset password code');
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.info('User creation requested', {
        context: UserService.name,
        username: createUserDto.username,
        email: createUserDto.email,
      });

      return await this.prisma.$transaction(async () => {
        const existsUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { username: createUserDto.username },
              { phone: createUserDto.phone },
            ],
          },
        });

        if (!existsUser) {
          const hash = await this.hashService.hash(createUserDto.password);
          const user = await this.prisma.user.create({
            data: { name: createUserDto.name, username: createUserDto.username, email: createUserDto.email, phone: createUserDto.phone, hash: hash }
          });

          this.logger.info('User created successfully', {
            context: UserService.name,
            userId: user.id,
            username: user.username,
          });

          return user;
        } else {
          this.logger.warn('User creation blocked: user already exists', {
            context: UserService.name,
            username: createUserDto.username,
            email: createUserDto.email,
          });
          throw new ConflictException('User already exists');
        }
      })
    } catch (error) {
      this.logger.error('User creation failed', {
        context: UserService.name,
        username: createUserDto.username,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not create user');
    }
  }

  async findOne(id: string) {
    try {
      this.logger.debug('User lookup requested', {
        context: UserService.name,
        userId: id,
      });

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: this.publicUserSelect,
      });

      if (!user) {
        this.logger.warn('User lookup failed: user not found', {
          context: UserService.name,
          userId: id,
        });
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error('User lookup failed', {
        context: UserService.name,
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not find user');
    }
  }

  async findAll() {
    try {
      this.logger.debug('User list requested', {
        context: UserService.name,
      });

      return await this.prisma.user.findMany({
        select: this.publicUserSelect,
        orderBy: {
          username: 'asc',
        },
      });
    } catch (error) {
      this.logger.error('User list failed', {
        context: UserService.name,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not list users');
    }
  }

  async requestResetPasswordOtp({ username }: RequestResetPasswordDto) {
    try {
      this.logger.info('Reset password OTP requested', {
        context: UserService.name,
        username,
      });

      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        this.logger.warn('Reset password OTP failed: user not found', {
          context: UserService.name,
          username,
        });
        throw new NotFoundException('User not found');
      }

      const otp = this.generateOtp();
      const otpHash = await this.hashService.hash(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const resetPasswordId = this.createResetPasswordToken({
        id: randomUUID(),
        userId: user.id,
        otpHash,
        expiresAt,
      });

      await this.resendService.sendResetPasswordOtp(user.email, otp);

      this.logger.info('Reset password OTP sent', {
        context: UserService.name,
        userId: user.id,
        username,
      });

      return { resetPasswordId, message: 'Reset password OTP sent' };
    } catch (error) {
      this.logger.error('Reset password OTP request failed', {
        context: UserService.name,
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not request reset password code');
    }
  }

  async resetPassword({ resetPasswordId, otp, newPassword }: ResetPasswordDto) {
    try {
      const resetPasswordRequest = this.parseResetPasswordToken(resetPasswordId);

      if (new Date(resetPasswordRequest.expiresAt).getTime() < Date.now()) {
        this.logger.warn('Reset password failed: code expired', {
          context: UserService.name,
          userId: resetPasswordRequest.userId,
        });
        throw new BadRequestException('Reset password code expired');
      }

      const isValidOtp = await this.hashService.validateHash(otp, resetPasswordRequest.otpHash);

      if (!isValidOtp) {
        this.logger.warn('Reset password failed: invalid code', {
          context: UserService.name,
          userId: resetPasswordRequest.userId,
        });
        throw new BadRequestException('Invalid reset password code');
      }

      const hash = await this.hashService.hash(newPassword);

      await this.prisma.user.update({
        where: { id: resetPasswordRequest.userId },
        data: {
          hash,
        },
      });

      this.logger.info('Password reset successfully', {
        context: UserService.name,
        userId: resetPasswordRequest.userId,
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      this.logger.error('Reset password failed', {
        context: UserService.name,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not reset password');
    }
  }

  async addCoins(
    id: string,
    { amount }: AddCoinsDto,
    authenticatedUserId: string,
    modType: string,
    modToken: string,
  ) {
    try {
      this.logger.info('Add coins requested', {
        context: UserService.name,
        userId: id,
        authenticatedUserId,
        amount,
        modType,
      });

      this.modAuthService.validateModApiKey(modType, modToken);

      if (authenticatedUserId !== id) {
        this.logger.warn('Add coins blocked: bearer user mismatch', {
          context: UserService.name,
          userId: id,
          authenticatedUserId,
          amount,
        });
        throw new ForbiddenException('Bearer token does not belong to the requested user');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          coins: {
            increment: amount,
          },
        },
        select: this.publicUserSelect,
      });

      this.logger.info('Coins added successfully', {
        context: UserService.name,
        userId: id,
        amount,
        coins: user.coins,
      });

      return user;
    } catch (error) {
      this.logger.error('Add coins failed', {
        context: UserService.name,
        userId: id,
        authenticatedUserId,
        amount,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePrismaError(error, 'Could not add coins to user');
    }
  }



  /*
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
    */
}
