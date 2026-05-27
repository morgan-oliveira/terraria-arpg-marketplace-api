import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PayWithCoinsDto {
  @ApiProperty({ example: '4c1c4d91-6e7b-4b67-8c5e-45e7f9585d9b', description: 'ID do usuario comprador.' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;
}
