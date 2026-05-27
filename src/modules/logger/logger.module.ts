import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const appName = configService.get<string>('APP_NAME', 'terraria-api-marketplace');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const lokiHost = configService.get<string>('LOKI_HOST');

        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.metadata({
                fillExcept: ['message', 'level', 'timestamp', 'ms'],
              }),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, ms, metadata }) => {
                const contextLabel = context ? ` [${context}]` : '';
                const metadataLabel =
                  metadata && Object.keys(metadata).length > 0
                    ? ` ${JSON.stringify(metadata)}`
                    : '';

                return `${timestamp} ${level}${contextLabel}: ${message}${metadataLabel} ${ms}`;
              }),
            ),
          }),
        ];

        if (lokiHost) {
          transports.push(
            new LokiTransport({
              host: lokiHost,
              labels: {
                app: appName,
                environment: nodeEnv,
              },
              json: true,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              replaceTimestamp: true,
              onConnectionError: (error) => {
                console.error('Loki connection error', error);
              },
            }),
          );
        }

        return {
          level: nodeEnv === 'production' ? 'info' : 'debug',
          defaultMeta: {
            app: appName,
            environment: nodeEnv,
          },
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
