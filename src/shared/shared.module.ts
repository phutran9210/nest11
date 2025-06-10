import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentService } from './services';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class SharedModule {}
