import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { AddCoinsDto } from './dto/add-coins.dto';
import { User } from 'src/common/decorators/user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Public()
  @ApiOperation({ summary: 'Cria um novo usuario.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Payload invalido.' })
  @ApiResponse({ status: 409, description: 'Username, telefone ou outro campo unico ja existe.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Busca usuario por ID.' })
  @ApiParam({ name: 'id', description: 'ID do usuario.', example: '4c1c4d91-6e7b-4b67-8c5e-45e7f9585d9b' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado sem dados sensiveis.' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado.' })
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista usuarios cadastrados.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios sem dados sensiveis.' })
  findAll() {
    return this.userService.findAll();
  }

  @Post('reset-password/request-otp')
  @Public()
  @ApiOperation({ summary: 'Solicita OTP de 6 digitos para redefinicao de senha.' })
  @ApiBody({ type: RequestResetPasswordDto })
  @ApiResponse({ status: 201, description: 'OTP enviado por e-mail e resetPasswordId retornado.' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado.' })
  @ApiResponse({ status: 500, description: 'Falha ao enviar e-mail.' })
  requestResetPasswordOtp(@Body() requestResetPasswordDto: RequestResetPasswordDto) {
    return this.userService.requestResetPasswordOtp(requestResetPasswordDto);
  }

  @Patch('reset-password')
  @Public()
  @ApiOperation({ summary: 'Redefine senha usando resetPasswordId e OTP recebido por e-mail.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Codigo invalido, expirado ou payload invalido.' })
  @ApiResponse({ status: 404, description: 'Usuario do token nao encontrado.' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(resetPasswordDto);
  }

  @Patch(':id/coins')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adiciona coins ao usuario autenticado por integracao do mod.' })
  @ApiParam({ name: 'id', description: 'ID do usuario que recebera coins. Deve ser igual ao sub do bearer.', example: '4c1c4d91-6e7b-4b67-8c5e-45e7f9585d9b' })
  @ApiHeader({ name: 'modType', description: 'Tipo do mod autorizado.', example: 'DIABLO' })
  @ApiHeader({ name: 'modToken', description: 'Token secreto do mod autorizado.' })
  @ApiBody({ type: AddCoinsDto })
  @ApiResponse({ status: 200, description: 'Coins adicionados e usuario atualizado retornado.' })
  @ApiResponse({ status: 400, description: 'Quantidade invalida.' })
  @ApiResponse({ status: 401, description: 'Bearer token, modType ou modToken invalido/ausente.' })
  @ApiResponse({ status: 403, description: 'Bearer token nao pertence ao usuario informado na rota.' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado.' })
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
