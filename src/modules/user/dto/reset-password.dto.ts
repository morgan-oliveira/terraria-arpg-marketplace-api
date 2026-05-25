import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class RequestResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetPasswordId: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
