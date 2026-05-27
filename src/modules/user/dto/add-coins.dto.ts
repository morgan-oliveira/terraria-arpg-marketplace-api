import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddCoinsDto {
  @ApiProperty({ example: 100, minimum: 1, description: 'Quantidade de coins a adicionar ao usuario.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;
}
