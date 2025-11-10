import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { MailSubjects } from './mail-subjects';
export interface SendMailTemplate {
    to?: string;
    templateName: string;
    context?: Record<string, any>;
    sendAsync?: boolean;
}

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);
    private templateCache = new Map<string, string>();

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: Number(this.configService.get('MAIL_PORT')),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            },
        });
    }

    /** -------------------------------
     *  Core Send Function
     * ------------------------------- */
    private async send(to: string, subject: string, html: string): Promise<void> {
        const from = `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_USER')}>`;

        try {
            const info = await this.transporter.sendMail({ from, to, subject, html });
            this.logger.log(`📨 Mail sent to ${to} | MessageId: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`❌ Failed to send mail to ${to}: ${error.message}`);
            throw error;
        }
    }

    private getTemplate(templateName: string, variables: Record<string, string>): string {
        const templatePath = path.join(__dirname, 'templates', templateName);

        // ✅ Optional caching for performance
        let html = this.templateCache.get(templatePath);
        if (!html) {
            html = fs.readFileSync(templatePath, 'utf8');
            this.templateCache.set(templatePath, html);
        }

        for (const key in variables) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        }
        return html;
    }

    async sendMailTemplate({ to, templateName, context = {}, sendAsync = false, }: SendMailTemplate): Promise<void> {
        const isAdminMail = !to;
        const recipient = isAdminMail ? process.env.SUPER_ADMIN_EMAIL : to;

        if (!recipient) {
            this.logger.warn(`⚠️ Missing recipient email for ${templateName}`);
            return;
        }

        const subject = MailSubjects[templateName] || 'Notification';
        const html = this.getTemplate(templateName, {
            ...context,
            year: new Date().getFullYear().toString(),
            adminDashboardUrl: process.env.ADMIN_URL,
            supportEmail: process.env.SUPPORT_EMAIL || this.configService.get('MAIL_USER'),
        });

        const sendPromise = this.send(recipient, subject, html);

        if (sendAsync) {
            sendPromise.catch((err) =>
                this.logger.warn(`Non-blocking mail failed (${templateName}): ${err.message}`),
            );
        } else {
            await sendPromise;
        }
    }
}
