import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '~core/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [],
  exports: [DatabaseModule],
})
export class CoreModule {}
