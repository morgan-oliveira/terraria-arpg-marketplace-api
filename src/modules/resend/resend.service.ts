import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class ResendService {
  private readonly resendApiUrl = 'https://api.resend.com/emails';

  constructor(private readonly configService: ConfigService) {}

  async sendEmail({ to, subject, html }: SendEmailInput) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_APIKEY');
    const from = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'DiabloTerraria Marketplace <onboarding@resend.dev>',
    );

    const response = await fetch(this.resendApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'terraria-arpg-marketplace-api',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(await this.getErrorMessage(response));
    }
  }

  private async getErrorMessage(response: Response) {
    const fallbackMessage = 'Could not send email';

    try {
      const error = await response.json();
      const message = error?.message || error?.error?.message || fallbackMessage;

      return `Resend error ${response.status}: ${message}`;
    } catch {
      const message = await response.text().catch(() => fallbackMessage);

      return `Resend error ${response.status}: ${message || fallbackMessage}`;
    }
  }

  async sendResetPasswordOtp(to: string, otp: string) {
    await this.sendEmail({
      to,
      subject: 'Codigo para redefinir sua senha',
      html: `
        <p>Use o codigo abaixo para redefinir sua senha:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>Este codigo expira em 10 minutos.</p>
      `,
    });
  }
}
