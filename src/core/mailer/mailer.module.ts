import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { MailerOptions } from '@nestjs-modules/mailer';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      useFactory: (configService: ConfigService): MailerOptions => {
        const mailerConfig = configService.get<MailerOptions>('mailer');
        if (!mailerConfig) {
          throw new Error('Mailer configuration not found');
        }
        return mailerConfig;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
