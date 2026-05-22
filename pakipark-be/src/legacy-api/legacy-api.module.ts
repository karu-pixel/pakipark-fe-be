import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { LegacyHandlerService } from './legacy-handler.service';
import { AdminOnlyGuard, AdminOrTellerGuard } from './roles.guard';
import {
  AnalyticsCompatController,
  AuthCompatController,
  BookingCompatController,
  LocationCompatController,
  LogsCompatController,
  NotificationCompatController,
  ParkingSlotCompatController,
  PaymentCompatController,
  PaymentMethodCompatController,
  ReviewCompatController,
  SettingsCompatController,
  UploadCompatController,
  UserCompatController,
  WebhookCompatController,
} from './legacy.controllers';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [
    AnalyticsCompatController,
    AuthCompatController,
    BookingCompatController,
    LocationCompatController,
    LogsCompatController,
    NotificationCompatController,
    ParkingSlotCompatController,
    PaymentCompatController,
    PaymentMethodCompatController,
    ReviewCompatController,
    SettingsCompatController,
    UploadCompatController,
    UserCompatController,
    WebhookCompatController,
  ],
  providers: [LegacyHandlerService, AdminOrTellerGuard, AdminOnlyGuard],
})
export class LegacyApiModule {}
