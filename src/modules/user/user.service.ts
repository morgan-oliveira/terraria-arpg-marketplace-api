import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { HashService } from '../hash/hash.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService
  ) { }
  async create(createUserDto: CreateUserDto) {
    await this.prisma.$transaction(async (prisma) => {
      const existsUser = await this.prisma.user.findUnique({
        where: {
          username: createUserDto.username,
          email: createUserDto.email
        }
      });

      if (!existsUser) {
        const hash = await this.hashService.hash(createUserDto.password);
        const user = await this.prisma.user.create({
          data: { name: createUserDto.name, username: createUserDto.username, email: createUserDto. email, phone: createUserDto.phone, hash: hash }
        });


        return user;
      } else {
        throw new ConflictException('User already exists');
      }
    })
  }

  /*
  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
    */
}
