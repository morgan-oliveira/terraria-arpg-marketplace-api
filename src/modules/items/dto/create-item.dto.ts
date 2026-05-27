import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";
import { Status } from "prisma/@prisma/client/enums";
import type { InputJsonValue } from "prisma/@prisma/client/internal/prismaNamespace";

export class CreateItemDto {
    @ApiPropertyOptional({ example: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3', description: 'ID externo opcional do item.' })
    @IsOptional()
    @IsString()
    @IsUUID()
    id?: string;

    @ApiProperty({ example: 'Legendary Copper Sword', description: 'Nome do item.' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 250, description: 'Preco em coins.' })
    @IsNotEmpty()
    @IsNumber()
    price: number;

    @ApiProperty({ example: { damage: 42, rarity: 'legendary' }, description: 'Dados livres do item enviados pelo mod.' })
    @IsNotEmpty()
    @IsObject()
    itemData: InputJsonValue;

    @ApiProperty({ enum: Status, example: Status.AVAILABLE, description: 'Status atual do item.' })
    @IsEnum(Status)
    status: Status;

    @ApiProperty({ example: '4c1c4d91-6e7b-4b67-8c5e-45e7f9585d9b', description: 'ID do usuario vendedor.' })
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    sellerId: string;

    @ApiPropertyOptional({ example: '7a5ea7ff-3494-4c8a-bd03-89007f0dc03d', description: 'ID do pedido, quando o item ja estiver vinculado.' })
    @IsOptional()
    @IsString()
    @IsUUID()
    orderId?: string;

    @ApiPropertyOptional({ example: '0dc7200f-f8f8-4d83-b803-f3658764064c', description: 'ID do carrinho, quando o item estiver reservado em carrinho.' })
    @IsOptional()
    @IsString()
    @IsUUID()
    cartId?: string;
}
