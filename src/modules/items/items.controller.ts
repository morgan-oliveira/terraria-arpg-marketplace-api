import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um item enviado pelo mod.' })
  @ApiHeader({ name: 'modType', description: 'Tipo do mod autorizado.', example: 'DIABLO' })
  @ApiHeader({ name: 'modToken', description: 'Token secreto do mod autorizado.' })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({ status: 201, description: 'Item criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Payload invalido ou relacao informada nao encontrada.' })
  @ApiResponse({ status: 401, description: 'Bearer token, modType ou modToken invalido/ausente.' })
  @ApiResponse({ status: 409, description: 'ID do item ja existe.' })
  create(
    @Body() createItemDto: CreateItemDto,
    @Headers('modtype') modType: string,
    @Headers('modtoken') modToken: string,
  ) {
    return this.itemsService.create(createItemDto, modType, modToken);
  }

  @Get()
  @ApiOperation({ summary: 'Lista itens com paginacao.' })
  @ApiQuery({ name: 'page', required: false, example: '1', description: 'Pagina desejada.' })
  @ApiQuery({ name: 'limit', required: false, example: '20', description: 'Quantidade por pagina, maximo 100.' })
  @ApiResponse({ status: 200, description: 'Lista paginada de itens.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.itemsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um item por ID.' })
  @ApiParam({ name: 'id', description: 'ID do item.', example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3' })
  @ApiResponse({ status: 200, description: 'Item encontrado.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Item nao encontrado.' })
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um item por ID.' })
  @ApiParam({ name: 'id', description: 'ID do item.', example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3' })
  @ApiResponse({ status: 200, description: 'Item removido.' })
  @ApiResponse({ status: 401, description: 'Bearer token ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Item nao encontrado.' })
  @ApiResponse({ status: 409, description: 'Item nao pode ser removido depois que pagamento iniciou.' })
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
