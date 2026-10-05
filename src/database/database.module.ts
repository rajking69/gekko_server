import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('mongodbUri');
        const options: Record<string, unknown> = {
          connectionFactory: (connection: {
            once: (event: string, listener: () => void) => void;
            readyState: number;
          }) => {
            const logger = new Logger('MongoDB');
            if (connection.readyState === 1) {
              logger.log('MongoDB connected');
            } else {
              connection.once('connected', () => logger.log('MongoDB connected'));
            }
            return connection;
          },
        };

        const databasePath = uri
          .replace(/^mongodb(?:\+srv)?:\/\/[^/]+/, '')
          .split('?')[0];
        const databaseName = databasePath.replace(/^\/+/, '');
        if (!databaseName) {
          options.dbName = 'Team_Gekko';
        }

        return { uri, ...options };
      },
    }),
  ],
})
export class DatabaseModule {}