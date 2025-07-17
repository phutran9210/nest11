import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type MailerOptions, MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { MailerService } from './mailer.service'

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      useFactory: (configService: ConfigService): MailerOptions => {
        const mailerConfig = configService.get<MailerOptions>('mailer')
        if (!mailerConfig) {
          throw new Error('Mailer configuration not found')
        }
        return mailerConfig
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
