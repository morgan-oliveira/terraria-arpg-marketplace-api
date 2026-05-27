import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class RequestResetPasswordDto {
  @ApiProperty({ example: 'playerOne', description: 'Username que recebera o codigo OTP no e-mail cadastrado.' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'eyJpZCI6...', description: 'Token assinado retornado pela rota de solicitacao de OTP.' })
  @IsString()
  @IsNotEmpty()
  resetPasswordId: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6, description: 'Codigo OTP de 6 digitos recebido por e-mail.' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp: string;

  @ApiProperty({ example: 'novaSenha123', minLength: 6, description: 'Nova senha do usuario.' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
