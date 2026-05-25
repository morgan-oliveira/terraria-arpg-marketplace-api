import { IsNotEmpty, IsObject, IsUUID } from "class-validator";
import { Item } from "prisma/@prisma/client/client";

export class CreateOrderDto {
    @IsUUID()
    @IsNotEmpty()
    id: string;
    
    @IsNotEmpty()
    @IsObject()
    Items: Item[]
}
