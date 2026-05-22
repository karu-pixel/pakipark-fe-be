import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AccessToken, User } from '../auth/user.decorator';

@Controller('api/vehicles')
@UseGuards(SupabaseAuthGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async getMyVehicles(@User() user: any, @AccessToken() accessToken: string) {
    const userId = user?.supabaseId || user?.supabase_id || user?.id;
    const data = await this.vehicleService.getMyVehicles(userId, accessToken);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'orDoc', maxCount: 1 },
      { name: 'crDoc', maxCount: 1 },
    ]),
  )
  async addVehicle(
    @User() user: any,
    @AccessToken() accessToken: string,
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles()
    files: { orDoc?: Express.Multer.File[]; crDoc?: Express.Multer.File[] },
  ) {
    const userId = user?.supabaseId || user?.supabase_id || user?.id;
    const data = await this.vehicleService.addVehicle(userId, accessToken, createVehicleDto, files || {});
    return { success: true, data };
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'orDoc', maxCount: 1 },
      { name: 'crDoc', maxCount: 1 },
    ]),
  )
  async updateVehicle(
    @User() user: any,
    @AccessToken() accessToken: string,
    @Param('id', ParseIntPipe) vehicleId: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @UploadedFiles()
    files: { orDoc?: Express.Multer.File[]; crDoc?: Express.Multer.File[] },
  ) {
    const userId = user?.supabaseId || user?.supabase_id || user?.id;
    const data = await this.vehicleService.updateVehicle(
      userId,
      accessToken,
      vehicleId,
      updateVehicleDto,
      files || {},
    );
    return { success: true, data };
  }

  @Delete(':id')
  async deleteVehicle(
    @User() user: any,
    @AccessToken() accessToken: string,
    @Param('id', ParseIntPipe) vehicleId: number,
  ) {
    const userId = user?.supabaseId || user?.supabase_id || user?.id;
    return this.vehicleService.deleteVehicle(userId, accessToken, vehicleId);
  }

  @Patch(':id/default')
  async setDefaultVehicle(
    @User() user: any,
    @AccessToken() accessToken: string,
    @Param('id', ParseIntPipe) vehicleId: number,
  ) {
    const userId = user?.supabaseId || user?.supabase_id || user?.id;
    const data = await this.vehicleService.setDefaultVehicle(userId, accessToken, vehicleId);
    return { success: true, data, message: 'Default vehicle updated' };
  }
}
