import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private configService: ConfigService) {}

  private get apiBaseUrl() {
    return this.configService.get<string>('APICENTER_URL') || 'https://api-center-test.itsandbox.site';
  }

  private get tribeId() {
    return this.configService.get<string>('APICENTER_TRIBE_ID') || 'pakiapps';
  }

  private get tribeSecret() {
    return this.configService.get<string>('APICENTER_TRIBE_SECRET') || 'u0ZHblGDbhaFfkIrgFwMs8JIn2GU1rmuct9Z5eK598rva1si';
  }

  private async makePostRequest(url: string, data: any, headers: Record<string, string> = {}): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });

    const body = await response.text();
    let json: any = {};
    try {
      json = body ? JSON.parse(body) : {};
    } catch {
      json = { raw: body };
    }

    if (response.status >= 200 && response.status < 300) {
      return json;
    } else {
      throw new Error(`API Error ${response.status}: ${body}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const response = await this.makePostRequest(`${this.apiBaseUrl}/api/v1/auth/token`, {
      tribeId: this.tribeId,
      secret: this.tribeSecret,
    });

    const payload = response.data || response;
    this.cachedToken = payload.accessToken || payload.token;
    const expiresIn = payload.expiresIn || 3300;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;

    return this.cachedToken!;
  }

  async sendBookingConfirmation(userEmail: string, bookingData: { reference: string; location: string; spot: string; date: string; timeSlot: string; amount: number }) {
    try {
      const token = await this.getAccessToken();
      const result = await this.makePostRequest(
        `${this.apiBaseUrl}/api/v1/shared/email/send`,
        {
          to: [{ email: userEmail }],
          subject: `Booking Confirmed - ${bookingData.reference}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e3d5a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">PakiPark</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1e3d5a;">Booking Confirmed!</h2>
                <p>Reference: <strong>${bookingData.reference}</strong></p>
                <p>Location: ${bookingData.location}</p>
                <p>Spot: ${bookingData.spot}</p>
                <p>Date: ${bookingData.date}</p>
                <p>Time: ${bookingData.timeSlot}</p>
                <p>Amount: PHP ${bookingData.amount}</p>
                <hr />
                <p style="color: #666; font-size: 12px;">
                  Please arrive within your reserved time slot. Thank you for using PakiPark!
                </p>
              </div>
            </div>
          `,
          text: `Booking Confirmed! Reference: ${bookingData.reference}`,
          metadata: { purpose: 'booking_confirmation', reference: bookingData.reference },
        },
        {
          'Authorization': `Bearer ${token}`,
          'X-SDK-Version': '1.1.2',
          'X-SDK-Tribe-Id': this.tribeId,
        },
      );
      this.logger.log(`APICenter booking confirmation sent to ${userEmail}. Status: ${result.status || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation via APICenter: ${errorMessage(error)}`);
    }
  }

  async sendPasswordReset(userEmail: string, resetToken: string) {
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    try {
      const token = await this.getAccessToken();
      await this.makePostRequest(
        `${this.apiBaseUrl}/api/v1/shared/email/send`,
        {
          to: [{ email: userEmail }],
          subject: 'Password Reset - PakiPark',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e3d5a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">PakiPark</h1>
              </div>
              <div style="padding: 30px;">
                <h2>Reset Your Password</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; background: #ee6b20; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                  Reset Password
                </a>
                <p style="color: #666; margin-top: 20px; font-size: 12px;">
                  This link expires in 1 hour. If you didn't request this, please ignore this email.
                </p>
              </div>
            </div>
          `,
          text: `Reset your password by visiting this link: ${resetUrl}`,
          metadata: { purpose: 'password_reset_link' },
        },
        {
          'Authorization': `Bearer ${token}`,
          'X-SDK-Version': '1.1.2',
          'X-SDK-Tribe-Id': this.tribeId,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send reset link via APICenter: ${errorMessage(error)}`);
    }
  }

  async sendPasswordResetOtp(toEmail: string, otp: string) {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:#1C436B;color:#fff;font-size:22px;font-weight:900;padding:10px 28px;border-radius:12px;letter-spacing:1px;">
            PakiPark
          </div>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px 24px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
          <h2 style="color:#1A2B3C;font-size:22px;margin:0 0 8px;">Password Reset</h2>
          <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Use the verification code below to reset your PakiPark password.
            This code is valid for <strong>10 minutes</strong>.
          </p>
          <div style="text-align:center;background:#FFF7F2;border:2px solid #FBC89C;border-radius:14px;padding:20px 0;margin-bottom:24px;">
            <span style="font-size:38px;font-weight:900;letter-spacing:12px;color:#1C436B;">${otp}</span>
          </div>
          <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin:0;">
            If you did not request a password reset, please ignore this email. Your account remains secure.
          </p>
        </div>
        <p style="text-align:center;color:#CBD5E1;font-size:11px;margin-top:20px;">
          &copy; ${new Date().getFullYear()} PakiPark. All rights reserved.
        </p>
      </div>
    `;

    try {
      const token = await this.getAccessToken();
      const result = await this.makePostRequest(
        `${this.apiBaseUrl}/api/v1/shared/email/send`,
        {
          to: [{ email: toEmail }],
          subject: `${otp} is your PakiPark password reset code`,
          html,
          text: `Your PakiPark password reset code is: ${otp}\n\nThis code expires in 10 minutes.`,
          metadata: { purpose: 'password_reset_otp', otpId: `reset_${Date.now()}` },
        },
        {
          'Authorization': `Bearer ${token}`,
          'X-SDK-Version': '1.1.2',
          'X-SDK-Tribe-Id': this.tribeId,
        },
      );
      this.logger.log(`APICenter OTP email sent to ${toEmail}. Status: ${result.status || 'unknown'}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send OTP email via APICenter: ${errorMessage(error)}`);
      throw new Error('Failed to send reset email. Please try again later.');
    }
  }
}
