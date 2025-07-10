import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get('mailer'),
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
