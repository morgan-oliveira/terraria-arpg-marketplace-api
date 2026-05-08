import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from "bcryptjs"

@Injectable()
export class HashService {
    constructor(private readonly configService: ConfigService) {}
    async hash(value: string) {
        return await bcrypt.hash(value, Number(this.configService.getOrThrow<string>('SALT_ROUNDS')));
    }
    async validateHash(value: string, hash: string) {
        return await bcrypt.compare(value, hash);
    }
}
