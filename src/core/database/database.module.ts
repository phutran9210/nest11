import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '~core/config/database.config';
import { DatabaseHealthService, DatabaseHealthController } from './health';
import { DatabaseService } from './database.service';
import { UserEntity } from '~shared/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = getDatabaseConfig(configService);
        return {
          ...config,
          entities: [UserEntity], // Explicit entity import to avoid glob pattern issues
          synchronize: false, // CRITICAL: Force synchronize to false
          migrationsRun: false, // CRITICAL: Force migrationsRun to false
          dropSchema: false, // CRITICAL: Force dropSchema to false
        };
      },
    }),
  ],
  controllers: [DatabaseHealthController],
  providers: [DatabaseHealthService, DatabaseService],
  exports: [TypeOrmModule, DatabaseHealthService, DatabaseService],
})
export class DatabaseModule {}
