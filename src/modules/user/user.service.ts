import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly modAuthService: ModAuthService
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


          return user;
        } else {
          throw new ConflictException('User already exists');
        }
      })
    } catch (error) {
      handlePrismaError(error, 'Could not create user');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: this.publicUserSelect,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      handlePrismaError(error, 'Could not find user');
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        select: this.publicUserSelect,
        orderBy: {
          username: 'asc',
        },
      });
    } catch (error) {
      handlePrismaError(error, 'Could not list users');
    }
  }

  async requestResetPasswordOtp({ username }: RequestResetPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
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

      return { resetPasswordId, message: 'Reset password OTP sent' };
    } catch (error) {
      handlePrismaError(error, 'Could not request reset password code');
    }
  }

  async resetPassword({ resetPasswordId, otp, newPassword }: ResetPasswordDto) {
    try {
      const resetPasswordRequest = this.parseResetPasswordToken(resetPasswordId);

      if (new Date(resetPasswordRequest.expiresAt).getTime() < Date.now()) {
        throw new BadRequestException('Reset password code expired');
      }

      const isValidOtp = await this.hashService.validateHash(otp, resetPasswordRequest.otpHash);

      if (!isValidOtp) {
        throw new BadRequestException('Invalid reset password code');
      }

      const hash = await this.hashService.hash(newPassword);

      await this.prisma.user.update({
        where: { id: resetPasswordRequest.userId },
        data: {
          hash,
        },
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
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
      this.modAuthService.validateModApiKey(modType, modToken);

      if (authenticatedUserId !== id) {
        throw new ForbiddenException('Bearer token does not belong to the requested user');
      }

      return await this.prisma.user.update({
        where: { id },
        data: {
          coins: {
            increment: amount,
          },
        },
        select: this.publicUserSelect,
      });
    } catch (error) {
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
