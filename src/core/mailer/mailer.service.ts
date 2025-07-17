import { Injectable } from '@nestjs/common'
import type { ISendMailOptions, MailerService as NestMailerService } from '@nestjs-modules/mailer'
import type { Attachment } from 'nodemailer/lib/mailer'

export interface SendMailOptions {
  to: string | string[]
  subject: string
  template?: string
  context?: Record<string, unknown>
  html?: string
  text?: string
  attachments?: Attachment[]
}

@Injectable()
export class MailerService {
  private readonly mailerService: NestMailerService
  constructor(mailerService: NestMailerService) {
    this.mailerService = mailerService
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: options.to,
      subject: options.subject,
    }

    if (options.template) {
      mailOptions.template = options.template
      mailOptions.context = options.context || {}
    } else if (options.html) {
      mailOptions.html = options.html
    } else if (options.text) {
      mailOptions.text = options.text
    }

    if (options.attachments) {
      mailOptions.attachments = options.attachments
    }

    await this.mailerService.sendMail(mailOptions)
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        name,
      },
    })
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name,
        resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    })
  }

  async sendEmailVerificationEmail(
    to: string,
    name: string,
    verificationToken: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Email Verification',
      template: 'email-verification',
      context: {
        name,
        verificationToken,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      },
    })
  }

  async sendPlainTextEmail(to: string, subject: string, text: string): Promise<void> {
    await this.sendMail({
      to,
      subject,
      text,
    })
  }

  async sendHtmlEmail(to: string, subject: string, html: string): Promise<void> {
    await this.sendMail({
      to,
      subject,
      html,
    })
  }
}
