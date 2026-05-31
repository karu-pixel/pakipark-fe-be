import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import * as path from 'path';

const BUCKET = 'vehicle-docs';
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(private supabaseService: SupabaseService) { }

  private userClient(accessToken: string): SupabaseClient {
    if (!accessToken) {
      throw new BadRequestException('Missing authenticated Supabase access token.');
    }
    return this.supabaseService.forUser(accessToken);
  }

  private assertUserId(userId: string) {
    if (!userId || !UUID_PATTERN.test(String(userId))) {
      throw new BadRequestException('Authenticated Supabase user id is missing or invalid.');
    }
    return String(userId);
  }

  private async uploadToSupabase(
    client: SupabaseClient,
    buffer: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<string> {
    const { error } = await client.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);
    }

    const { data } = client.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  private getExtension(originalname: string, mimetype: string): string {
    const ext = path.extname(originalname || '').toLowerCase();
    if (ext) return ext;
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    return mimeMap[mimetype] || '.bin';
  }

  private normalizeVehicle(row: any) {
    if (!row) return row;
    const type = row.type || row.vehicle_type || 'sedan';
    return {
      id: row.id,
      _id: String(row.id),
      user_id: row.user_id,
      brand: row.brand || '',
      model: row.model || '',
      color: row.color || '',
      plate_number: row.plate_number || row.plateNumber || '',
      plateNumber: row.plate_number || row.plateNumber || '',
      type,
      vehicle_type: type,
      orDoc: row.or_doc || row.orDoc || null,
      crDoc: row.cr_doc || row.crDoc || null,
      or_doc: row.or_doc || row.orDoc || null,
      cr_doc: row.cr_doc || row.crDoc || null,
      isDefault: row.is_default ?? row.isDefault ?? false,
      is_default: row.is_default ?? row.isDefault ?? false,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
    };
  }

  private vehicleTable() {
    return 'teller.vehicles';
  }

  private handleVehicleError(error: { message: string; code?: string }) {
    if (/schema.*teller|invalid schema|must be one of the following schemas/i.test(error.message)) {
      return new BadRequestException(
        `${this.vehicleTable()} is not available through Supabase PostgREST. Expose the teller schema in Supabase Project Settings -> API -> Exposed schemas, then apply pakipark-be-nestjs/database/teller_vehicle_rpc.sql for grants and RLS.`,
      );
    }

    return new BadRequestException(error.message);
  }

  async getMyVehicles(userId: string, accessToken: string) {
    userId = this.assertUserId(userId);
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .schema('teller')
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw this.handleVehicleError(error);
    return (data || []).map((v) => this.normalizeVehicle(v));
  }

  async addVehicle(
    userId: string,
    accessToken: string,
    createVehicleDto: CreateVehicleDto,
    files: { orDoc?: Express.Multer.File[]; crDoc?: Express.Multer.File[] },
  ) {
    userId = this.assertUserId(userId);
    const client = this.userClient(accessToken);
    const orFile = files.orDoc?.[0];
    const crFile = files.crDoc?.[0];

    const requireDocs = true;
    const allowedTypes = ['sedan', 'suv', 'truck', 'motorcycle'];

    if (requireDocs) {
      if (!orFile) throw new BadRequestException('Official Receipt (OR) document is required.');
      if (!crFile) throw new BadRequestException('Certificate of Registration (CR) document is required.');
    }

    const { brand, model, color, plateNumber, type } = createVehicleDto;
    const lowerType = (type || 'sedan').toLowerCase();
    if (allowedTypes && !allowedTypes.includes(lowerType)) {
      throw new BadRequestException(`Vehicle type '${type}' is not allowed.`);
    }

    const existingVehicles = await this.getMyVehicles(userId, accessToken);
    const { data: vehicle, error: insertError } = await client
      .schema('teller')
      .from('vehicles')
      .insert({
        user_id: userId,
        brand,
        model,
        color,
        plate_number: plateNumber,
        type: lowerType,
        is_default: existingVehicles.length === 0,
      })
      .select('*')
      .single();

    if (insertError) throw this.handleVehicleError(insertError);

    // 2. Upload OR/CR files
    let orUrl: string | null = null;
    let crUrl: string | null = null;
    const ts = Date.now();
    const uploads: Promise<any>[] = [];

    if (orFile) {
      const orPath = `${userId}/${vehicle.id}-${ts}-or${this.getExtension(orFile.originalname, orFile.mimetype)}`;
      uploads.push(this.uploadToSupabase(client, orFile.buffer, orPath, orFile.mimetype).then((url) => { orUrl = url; }));
    }
    if (crFile) {
      const crPath = `${userId}/${vehicle.id}-${ts}-cr${this.getExtension(crFile.originalname, crFile.mimetype)}`;
      uploads.push(this.uploadToSupabase(client, crFile.buffer, crPath, crFile.mimetype).then((url) => { crUrl = url; }));
    }

    try {
      await Promise.all(uploads);
    } catch (uploadErr) {
      // Cleanup on failure
      try {
        await client
          .schema('teller')
          .from('vehicles')
          .delete()
          .eq('id', vehicle.id)
          .eq('user_id', userId);
      } catch (cleanupErr) {
        this.logger.warn(`Failed to cleanup vehicle record after upload failure: ${errorMessage(cleanupErr)}`);
      }
      throw uploadErr;
    }

    // 3. Update paths
    if (orUrl || crUrl) {
      const updatePayload: Record<string, string> = {};
      if (orUrl) updatePayload.or_doc = orUrl;
      if (crUrl) updatePayload.cr_doc = crUrl;

      const { data: updatedVehicle, error: updateError } = await client
        .schema('teller')
        .from('vehicles')
        .update(updatePayload)
        .eq('id', vehicle.id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (updateError) throw this.handleVehicleError(updateError);
      return this.normalizeVehicle(updatedVehicle);
    }

    return this.normalizeVehicle(vehicle);
  }

  async updateVehicle(
    userId: string,
    accessToken: string,
    vehicleId: number,
    updateVehicleDto: UpdateVehicleDto,
    files: { orDoc?: Express.Multer.File[]; crDoc?: Express.Multer.File[] },
  ) {
    userId = this.assertUserId(userId);
    const client = this.userClient(accessToken);
    const orFile = files.orDoc?.[0];
    const crFile = files.crDoc?.[0];

    let orUrl: string | null = null;
    let crUrl: string | null = null;
    const ts = Date.now();
    const uploads: Promise<any>[] = [];

    if (orFile) {
      const orPath = `${userId}/${vehicleId}-${ts}-or${this.getExtension(orFile.originalname, orFile.mimetype)}`;
      uploads.push(this.uploadToSupabase(client, orFile.buffer, orPath, orFile.mimetype).then((url) => { orUrl = url; }));
    }
    if (crFile) {
      const crPath = `${userId}/${vehicleId}-${ts}-cr${this.getExtension(crFile.originalname, crFile.mimetype)}`;
      uploads.push(this.uploadToSupabase(client, crFile.buffer, crPath, crFile.mimetype).then((url) => { crUrl = url; }));
    }

    if (uploads.length > 0) {
      await Promise.all(uploads);
    }

    const { brand, model, color, plateNumber, type } = updateVehicleDto;
    const updatePayload: any = {};
    if (brand) updatePayload.brand = brand;
    if (model) updatePayload.model = model;
    if (color) updatePayload.color = color;
    if (plateNumber) updatePayload.plate_number = plateNumber;
    if (type) updatePayload.type = type;
    if (orUrl) updatePayload.or_doc = orUrl;
    if (crUrl) updatePayload.cr_doc = crUrl;

    const { data: updated, error } = await client
      .schema('teller')
      .from('vehicles')
      .update(updatePayload)
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw this.handleVehicleError(error);
    return this.normalizeVehicle(updated);
  }

  async deleteVehicle(userId: string, accessToken: string, vehicleId: number) {
    userId = this.assertUserId(userId);
    const client = this.userClient(accessToken);
    const { error } = await client
      .schema('teller')
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (error) throw this.handleVehicleError(error);
    return { success: true, message: 'Vehicle deleted' };
  }

  async setDefaultVehicle(userId: string, accessToken: string, vehicleId: number) {
    userId = this.assertUserId(userId);
    const client = this.userClient(accessToken);
    const { data: vehicle, error: findError } = await client
      .schema('teller')
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw this.handleVehicleError(findError);
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const { error: clearError } = await client
      .schema('teller')
      .from('vehicles')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (clearError) throw this.handleVehicleError(clearError);

    const { data: updated, error: updateError } = await client
      .schema('teller')
      .from('vehicles')
      .update({ is_default: true })
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) throw this.handleVehicleError(updateError);
    return this.normalizeVehicle(updated);
  }
}
