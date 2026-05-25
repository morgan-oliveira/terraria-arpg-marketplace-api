import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

type PrismaErrorLike = {
  code?: string;
  name?: string;
  message?: string;
  meta?: {
    target?: string[] | string;
    field_name?: string;
    cause?: string;
  };
};

function getPrismaError(error: unknown): PrismaErrorLike {
  return typeof error === 'object' && error !== null ? (error as PrismaErrorLike) : {};
}

function getTargetMessage(target?: string[] | string) {
  if (!target) {
    return 'record';
  }

  return Array.isArray(target) ? target.join(', ') : target;
}

export function handlePrismaError(error: unknown, fallbackMessage = 'Database operation failed'): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const prismaError = getPrismaError(error);

  switch (prismaError.code) {
    case 'P2000':
      throw new BadRequestException('A provided value is too long');
    case 'P2002':
      throw new ConflictException(`${getTargetMessage(prismaError.meta?.target)} already exists`);
    case 'P2003':
      throw new BadRequestException('Related record not found or cannot be changed');
    case 'P2006':
      throw new BadRequestException('Invalid value provided');
    case 'P2011':
      throw new BadRequestException('Required field cannot be null');
    case 'P2012':
    case 'P2013':
      throw new BadRequestException('Missing required field');
    case 'P2014':
      throw new ConflictException('Requested change violates an existing relation');
    case 'P2023':
      throw new BadRequestException('Invalid record identifier');
    case 'P2025':
      throw new NotFoundException(prismaError.meta?.cause || 'Record not found');
    case 'P2028':
      throw new ConflictException('Database transaction could not be completed');
    default:
      break;
  }

  if (prismaError.name === 'PrismaClientValidationError') {
    throw new BadRequestException('Invalid database query');
  }

  if (prismaError.name === 'PrismaClientInitializationError') {
    throw new ServiceUnavailableException('Database is unavailable');
  }

  throw new InternalServerErrorException(fallbackMessage);
}
