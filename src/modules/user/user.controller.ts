import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { AddCoinsDto } from './dto/add-coins.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Get()
  @Public()
  findAll() {
    return this.userService.findAll();
  }

  @Post('reset-password/request-otp')
  @Public()
  requestResetPasswordOtp(@Body() requestResetPasswordDto: RequestResetPasswordDto) {
    return this.userService.requestResetPasswordOtp(requestResetPasswordDto);
  }

  @Patch('reset-password')
  @Public()
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(resetPasswordDto);
  }

  @Patch(':id/coins')
  addCoins(
    @Param('id') id: string,
    @Body() addCoinsDto: AddCoinsDto,
    @User() user: { sub: string },
    @Headers('modtype') modType: string,
    @Headers('modtoken') modToken: string,
  ) {
    return this.userService.addCoins(id, addCoinsDto, user.sub, modType, modToken);
  }

  

  /*
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
    */
}
