import { Module } from '@nestjs/common';
import { ModAuthService } from './mod-auth.service';

@Module({
  providers: [ModAuthService],
  exports: [ModAuthService],
})
export class ModAuthModule {}
