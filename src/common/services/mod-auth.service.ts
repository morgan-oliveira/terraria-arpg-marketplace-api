import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class ModAuthService {
  constructor(private readonly configService: ConfigService) {}

  validateModApiKey(modType: string, modToken: string) {
    const expectedModType = this.configService.get<string>('DIABLO_MOD_TYPE');
    const expectedModToken = this.configService.get<string>('DIABLO_MOD_TOKEN');

    if (!expectedModType || !expectedModToken) {
      throw new InternalServerErrorException('Mod API key is not configured');
    }

    if (!modType || !modToken) {
      throw new UnauthorizedException('Missing modType or modToken header');
    }

    if (modType !== expectedModType) {
      throw new UnauthorizedException('Invalid modType');
    }

    const expectedTokenBuffer = Buffer.from(expectedModToken);
    const receivedTokenBuffer = Buffer.from(modToken);

    if (
      expectedTokenBuffer.length !== receivedTokenBuffer.length ||
      !timingSafeEqual(expectedTokenBuffer, receivedTokenBuffer)
    ) {
      throw new UnauthorizedException('Invalid modToken');
    }
  }
}
