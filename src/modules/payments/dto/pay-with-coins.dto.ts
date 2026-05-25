import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PayWithCoinsDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;
}
