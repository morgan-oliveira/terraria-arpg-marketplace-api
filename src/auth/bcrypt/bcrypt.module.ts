import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { BcryptController } from './bcrypt.controller';

@Module({
  controllers: [BcryptController],
  providers: [BcryptService],
})
export class BcryptModule {}
