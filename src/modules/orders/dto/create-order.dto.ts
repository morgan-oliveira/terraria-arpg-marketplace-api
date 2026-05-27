import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsUUID } from "class-validator";
import { Item } from "prisma/@prisma/client/client";

export class CreateOrderDto {
    @ApiProperty({ example: '7a5ea7ff-3494-4c8a-bd03-89007f0dc03d', description: 'ID do pedido.' })
    @IsUUID()
    @IsNotEmpty()
    id: string;
    
    @ApiProperty({
        description: 'Itens do pedido que serao validados e reservados.',
        example: [{ id: 'c3cb3b8e-b83f-41c7-a503-d2f4d5f5f9f3', status: 'AVAILABLE' }],
        type: 'array',
        items: { type: 'object' },
    })
    @IsNotEmpty()
    @IsObject()
    Items: Item[]
}
