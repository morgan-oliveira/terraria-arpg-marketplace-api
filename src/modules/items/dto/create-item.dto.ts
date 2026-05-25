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
    @IsOptional()
    @IsString()
    @IsUUID()
    id?: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsObject()
    itemData: InputJsonValue;

    @IsEnum(Status)
    status: Status;

    @IsNotEmpty()
    @IsString()
    @IsUUID()
    sellerId: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    orderId?: string;

    @IsOptional()
    @IsString()
    @IsUUID()
    cartId?: string;
}
