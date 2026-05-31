import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AdminOnlyGuard, AdminOrTellerGuard } from './roles.guard';
import { LegacyHandlerService } from './legacy-handler.service';

type LegacyRequest = Request & {
  body: any;
  query: any;
  params: any;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  uploadFolder?: string;
};

abstract class CompatController {
  constructor(protected readonly legacy: LegacyHandlerService) { }

  protected async call(controller: string, action: string, req: Request, res: Response) {
    await this.legacy.call(controller, action, req, res);
  }
}

@Controller('api/auth')
export class AuthCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post('register/customer')
  registerCustomer(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'registerCustomer', req, res);
  }

  @Post('register/partner')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'permit', maxCount: 1 },
      { name: 'registration', maxCount: 1 },
      { name: 'ownership', maxCount: 1 },
    ]),
  )
  registerPartner(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    (req as LegacyRequest).uploadFolder = 'partners';
    (req as LegacyRequest).files = files || {};
    return this.call('auth', 'registerPartner', req, res);
  }

  @Post('register/admin')
  registerAdmin(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'registerAdmin', req, res);
  }

  @Post('login')
  login(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'login', req, res);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'getMe', req, res);
  }

  @Post('forgot-password')
  forgotPassword(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'forgotPassword', req, res);
  }

  @Post('verify-reset-otp')
  verifyResetOtp(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'verifyResetOtp', req, res);
  }

  @Post('reset-password')
  resetPassword(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'resetPassword', req, res);
  }

  @Post('social-login')
  socialLogin(@Req() req: Request, @Res() res: Response) {
    return this.call('auth', 'socialLogin', req, res);
  }
}

@Controller('api/bookings')
@UseGuards(SupabaseAuthGuard)
export class BookingCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post()
  create(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'createBooking', req, res);
  }

  @Post('pending')
  createPending(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'createPendingBooking', req, res);
  }

  @Get('my')
  my(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'getMyBookings', req, res);
  }

  @Get('slots/:locationId')
  slots(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'getAvailableSlots', req, res);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'cancelBooking', req, res);
  }

  @Get(':id')
  byId(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'getBookingById', req, res);
  }

  @Get()
  @UseGuards(AdminOrTellerGuard)
  all(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'getAllBookings', req, res);
  }

  @Patch(':id/status')
  @UseGuards(AdminOrTellerGuard)
  status(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'updateBookingStatus', req, res);
  }

  @Patch(':id/checkin')
  @UseGuards(AdminOrTellerGuard)
  checkin(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'checkInBooking', req, res);
  }

  @Patch(':id/checkout')
  @UseGuards(AdminOrTellerGuard)
  checkout(@Req() req: Request, @Res() res: Response) {
    return this.call('booking', 'checkOutBooking', req, res);
  }
}

@Controller('api/locations')
@UseGuards(SupabaseAuthGuard)
export class LocationCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get()
  list(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'getLocations', req, res);
  }

  @Get(':id')
  one(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'getLocation', req, res);
  }

  @Get(':id/vitals')
  vitals(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'getLocationVitals', req, res);
  }

  @Post()
  @UseGuards(AdminOrTellerGuard)
  create(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'createLocation', req, res);
  }

  @Put(':id')
  @UseGuards(AdminOrTellerGuard)
  update(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'updateLocation', req, res);
  }

  @Delete(':id')
  @UseGuards(AdminOrTellerGuard)
  remove(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'deleteLocation', req, res);
  }

  @Patch(':id/hours')
  updateHours(@Req() req: Request, @Res() res: Response) {
    return this.call('location', 'updateOperatingHours', req, res);
  }
}

@Controller('api/analytics')
@UseGuards(SupabaseAuthGuard, AdminOrTellerGuard)
export class AnalyticsCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get('dashboard') dashboard(@Req() req: Request, @Res() res: Response) { return this.call('analytics', 'getDashboardStats', req, res); }
  @Get('revenue') revenue(@Req() req: Request, @Res() res: Response) { return this.call('analytics', 'getRevenueData', req, res); }
  @Get('occupancy') occupancy(@Req() req: Request, @Res() res: Response) { return this.call('analytics', 'getOccupancyData', req, res); }
  @Get('vehicle-types') vehicleTypes(@Req() req: Request, @Res() res: Response) { return this.call('analytics', 'getVehicleTypeDistribution', req, res); }
  @Get('payment-methods') paymentMethods(@Req() req: Request, @Res() res: Response) { return this.call('analytics', 'getPaymentMethodDistribution', req, res); }
}

@Controller('api/reviews')
@UseGuards(SupabaseAuthGuard)
export class ReviewCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post() create(@Req() req: Request, @Res() res: Response) { return this.call('review', 'createReview', req, res); }
  @Get('my') my(@Req() req: Request, @Res() res: Response) { return this.call('review', 'getMyReviews', req, res); }
  @Get('stats') stats(@Req() req: Request, @Res() res: Response) { return this.call('review', 'getReviewStats', req, res); }
  @Get() list(@Req() req: Request, @Res() res: Response) { return this.call('review', 'getReviews', req, res); }
}

@Controller('api/settings')
@UseGuards(SupabaseAuthGuard)
export class SettingsCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get('public/parking-rates') publicRates(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getParkingRates', req, res); }
  @Get('parking-rates') @UseGuards(AdminOrTellerGuard) rates(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getParkingRates', req, res); }
  @Post('parking-rates') @UseGuards(AdminOrTellerGuard) createRate(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'createParkingRate', req, res); }
  @Put('parking-rates/:id') @UseGuards(AdminOrTellerGuard) updateRate(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'updateParkingRate', req, res); }
  @Delete('parking-rates/:id') @UseGuards(AdminOrTellerGuard) deleteRate(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'deleteParkingRate', req, res); }
  @Get('pricing-rules') @UseGuards(AdminOrTellerGuard) pricingRules(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getPricingRules', req, res); }
  @Post('pricing-rules') @UseGuards(AdminOrTellerGuard) createRule(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'createPricingRule', req, res); }
  @Put('pricing-rules/:id') @UseGuards(AdminOrTellerGuard) updateRule(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'updatePricingRule', req, res); }
  @Delete('pricing-rules/:id') @UseGuards(AdminOrTellerGuard) deleteRule(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'deletePricingRule', req, res); }
  @Get('admin-users') @UseGuards(AdminOrTellerGuard) adminUsers(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getAdminUsers', req, res); }
  @Get('public/:category') publicCategory(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getSettings', req, res); }
  @Get(':category') @UseGuards(AdminOrTellerGuard) category(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'getSettings', req, res); }
  @Put(':category') @UseGuards(AdminOrTellerGuard) updateCategory(@Req() req: Request, @Res() res: Response) { return this.call('settings', 'updateSettings', req, res); }
}

@Controller('api/users')
@UseGuards(SupabaseAuthGuard)
export class UserCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get('profile') profile(@Req() req: Request, @Res() res: Response) { return this.call('user', 'getProfile', req, res); }
  @Put('profile') updateProfile(@Req() req: Request, @Res() res: Response) { return this.call('user', 'updateProfile', req, res); }
  @Put('password') password(@Req() req: Request, @Res() res: Response) { return this.call('user', 'changePassword', req, res); }
  @Delete('account') deleteAccount(@Req() req: Request, @Res() res: Response) { return this.call('user', 'deleteAccount', req, res); }
  @Get('pending-partners') @UseGuards(AdminOrTellerGuard) pendingPartners(@Req() req: Request, @Res() res: Response) { return this.call('user', 'getPendingPartners', req, res); }
  @Patch(':id/partner-verification') @UseGuards(AdminOrTellerGuard) partnerVerification(@Req() req: Request, @Res() res: Response) { return this.call('user', 'reviewPartnerRegistration', req, res); }
  @Get() all(@Req() req: Request, @Res() res: Response) { return this.call('user', 'getAllUsers', req, res); }
}

@Controller('api/parking-slots')
@UseGuards(SupabaseAuthGuard)
export class ParkingSlotCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get('location/:locationId') location(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'getSlotsByLocation', req, res); }
  @Get('available/:locationId') available(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'getAvailableSlots', req, res); }
  @Get('dashboard/:locationId') @UseGuards(AdminOrTellerGuard) dashboard(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'getDashboardSlots', req, res); }
  @Get(':id') getSlot(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'getSlot', req, res); }
  @Post('generate') @UseGuards(AdminOrTellerGuard) generate(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'generateSlots', req, res); }
  @Post() @UseGuards(AdminOrTellerGuard) create(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'createSlot', req, res); }
  @Put(':id') @UseGuards(AdminOrTellerGuard) update(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'updateSlot', req, res); }
  @Delete(':id') @UseGuards(AdminOnlyGuard) remove(@Req() req: Request, @Res() res: Response) { return this.call('parkingSlot', 'deleteSlot', req, res); }
}

@Controller('api/payment-methods')
@UseGuards(SupabaseAuthGuard)
export class PaymentMethodCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get() list(@Req() req: Request, @Res() res: Response) { return this.call('paymentMethod', 'getPaymentMethods', req, res); }
  @Post() add(@Req() req: Request, @Res() res: Response) { return this.call('paymentMethod', 'addPaymentMethod', req, res); }
  @Put(':id') update(@Req() req: Request, @Res() res: Response) { return this.call('paymentMethod', 'updatePaymentMethod', req, res); }
  @Delete(':id') remove(@Req() req: Request, @Res() res: Response) { return this.call('paymentMethod', 'deletePaymentMethod', req, res); }
}

@Controller('api/payments')
export class PaymentCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post('paymongo/intent') @UseGuards(SupabaseAuthGuard) intent(@Req() req: Request, @Res() res: Response) { return this.call('payment', 'createPayMongoIntent', req, res); }
  @Post('paymongo/verify') @UseGuards(SupabaseAuthGuard) verify(@Req() req: Request, @Res() res: Response) { return this.call('payment', 'verifyPayMongoPayment', req, res); }
  @Post('paymongo/webhook') webhook(@Req() req: Request, @Res() res: Response) { return this.call('payment', 'paymongoWebhook', req, res); }
  @Get('paymongo/callback') callback(@Req() req: Request, @Res() res: Response) { return this.call('payment', 'paymongoCallback', req, res); }
}

@Controller('api/logs')
@UseGuards(SupabaseAuthGuard, AdminOrTellerGuard)
export class LogsCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get('transactions') transactions(@Req() req: Request, @Res() res: Response) { return this.call('logs', 'getTransactionLogs', req, res); }
  @Get('transactions/stats') transactionStats(@Req() req: Request, @Res() res: Response) { return this.call('logs', 'getTransactionStats', req, res); }
  @Get('activity') activity(@Req() req: Request, @Res() res: Response) { return this.call('logs', 'getActivityLogs', req, res); }
  @Get('activity/stats') activityStats(@Req() req: Request, @Res() res: Response) { return this.call('logs', 'getActivityStats', req, res); }
}

@Controller('api/uploads')
@UseGuards(SupabaseAuthGuard)
export class UploadCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  avatar(@Req() req: Request, @Res() res: Response, @UploadedFile() file?: Express.Multer.File) {
    (req as LegacyRequest).uploadFolder = 'avatars';
    (req as LegacyRequest).file = file;
    return this.call('upload', 'uploadAvatar', req, res);
  }

  @Post('vehicle/:vehicleId/or')
  @UseInterceptors(FileInterceptor('orDoc'))
  orDoc(@Req() req: Request, @Res() res: Response, @UploadedFile() file?: Express.Multer.File) {
    (req as LegacyRequest).uploadFolder = 'vehicles';
    (req as LegacyRequest).file = file;
    return this.call('upload', 'uploadOrDoc', req, res);
  }

  @Post('vehicle/:vehicleId/cr')
  @UseInterceptors(FileInterceptor('crDoc'))
  crDoc(@Req() req: Request, @Res() res: Response, @UploadedFile() file?: Express.Multer.File) {
    (req as LegacyRequest).uploadFolder = 'vehicles';
    (req as LegacyRequest).file = file;
    return this.call('upload', 'uploadCrDoc', req, res);
  }

  @Get('my') my(@Req() req: Request, @Res() res: Response) { return this.call('upload', 'getMyUploads', req, res); }
  @Delete(':id') remove(@Req() req: Request, @Res() res: Response) { return this.call('upload', 'deleteUpload', req, res); }
}

@Controller('api/notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Get() list(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'getMyNotifications', req, res); }
  @Get('unread-count') unread(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'getUnreadCount', req, res); }
  @Patch('read-all') readAll(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'markAllRead', req, res); }
  @Delete() clear(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'clearAll', req, res); }
  @Patch(':id/read') readOne(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'markOneRead', req, res); }
  @Delete(':id') deleteOne(@Req() req: Request, @Res() res: Response) { return this.call('notification', 'deleteOne', req, res); }
}

@Controller('webhooks')
export class WebhookCompatController extends CompatController {
  constructor(legacy: LegacyHandlerService) {
    super(legacy);
  }

  @Post('payment/status')
  paymentStatus(@Req() req: Request, @Res() res: Response) {
    return this.call('webhook', 'paymentStatus', req, res);
  }
}
