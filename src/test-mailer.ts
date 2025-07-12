import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MailerService } from '~core/mailer';

async function testMailer() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mailerService = app.get(MailerService);

  try {
    console.log('Testing mailer service...');

    // Test plain text email
    await mailerService.sendPlainTextEmail(
      'test@example.com',
      'Test Email',
      'This is a test email from NestJS Mailer',
    );

    console.log('Plain text email sent successfully!');

    // Test welcome email with template
    await mailerService.sendWelcomeEmail('test@example.com', 'Test User');

    console.log('Welcome email sent successfully!');

    // Test password reset email
    await mailerService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'test-reset-token-123',
    );

    console.log('Password reset email sent successfully!');

    // Test email verification
    await mailerService.sendEmailVerificationEmail(
      'test@example.com',
      'Test User',
      'test-verification-token-123',
    );

    console.log('Email verification sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  } finally {
    await app.close();
  }
}

testMailer().catch(console.error);
