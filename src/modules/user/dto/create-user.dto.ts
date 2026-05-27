import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ example: 'Player One', description: 'Nome de exibicao do usuario.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'playerOne', description: 'Username unico usado para login.' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'senha123', description: 'Senha inicial do usuario.' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ example: 'player@example.com', description: 'E-mail para contato e recuperacao de senha.' })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '+5511999999999', description: 'Telefone unico do usuario.' })
    @IsString()
    @IsNotEmpty()
    phone: string;

}
