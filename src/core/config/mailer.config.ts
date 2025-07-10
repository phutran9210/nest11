import { registerAs } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

export default registerAs('mailer', (): MailerOptions => {
  const {
    MAIL_HOST,
    MAIL_PORT,
    MAIL_USERNAME,
    MAIL_PASSWORD,
    MAIL_FROM,
    MAIL_FROM_NAME,
    MAIL_SECURE,
  } = process.env;

  return {
    transport: {
      host: MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(MAIL_PORT || '587', 10),
      secure: MAIL_SECURE === 'true',
      auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
      },
    },
    defaults: {
      from: `"${MAIL_FROM_NAME || 'No Reply'}" <${MAIL_FROM || 'noreply@example.com'}>`,
    },
    template: {
      dir: path.join(__dirname, '../../../templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
});
