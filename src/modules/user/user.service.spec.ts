import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../hash/hash.service';
import { ResendService } from '../resend/resend.service';
import { ConfigService } from '@nestjs/config';
import { ModAuthService } from '../../common/services/mod-auth.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: HashService,
          useValue: {},
        },
        {
          provide: ResendService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: ModAuthService,
          useValue: {
            validateModApiKey: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
