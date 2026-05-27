import { ApiProperty } from '@nestjs/swagger';
import { IsString } from "class-validator";


export class LoginDTO {
    @ApiProperty({ example: 'playerOne', description: 'Username cadastrado do usuario.' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'senha123', description: 'Senha em texto plano para autenticacao.' })
    @IsString()
    password: string;
}
