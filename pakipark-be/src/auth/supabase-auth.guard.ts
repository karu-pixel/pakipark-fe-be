import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authorized, no token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const client = this.supabaseService.client;
      
      // 1. Get user from Supabase auth with the client JWT
      const { data: { user: sbUser }, error: sbError } = await client.auth.getUser(token);

      if (sbError || !sbUser) {
        throw new UnauthorizedException('Not authorized, token failed');
      }

      // 2. Query mapped user profile from the account schema.
      let localUser = await this.findProfileById(sbUser.id);
      if (localUser) {
        request.user = this.mapProfileUser(localUser);
        request.accessToken = token;
        return true;
      }

      const accountUser = await this.findAccountUserBySupabaseId(sbUser.id);
      if (accountUser) {
        request.user = this.mapAccountUser(accountUser);
        request.accessToken = token;
        return true;
      }

      return await this.tryLocalJwt(request, token);
    } catch (error) {
      try {
        return await this.tryLocalJwt(request, token);
      } catch {
        throw new UnauthorizedException(errorMessage(error) || 'Not authorized, token failed');
      }
    }
  }

  private async findProfileById(id: string) {
    const client = this.supabaseService.client;
    const { data, error } = await client.schema('account')
      .from('profiles')
      .select('id, full_name, email, phone, role, address, dob, profile_picture, two_factor_enabled, is_verified, created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  private async findAccountUserBySupabaseId(id: string) {
    const client = this.supabaseService.client;
    let { data, error } = await client.schema('account')
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deletedAt', null)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    ({ data, error } = await client.schema('account')
      .from('users')
      .select('*')
      .eq('supabaseId', id)
      .is('deletedAt', null)
      .maybeSingle());
    if (error) throw error;
    if (data) return data;

    ({ data, error } = await client.schema('account')
      .from('users')
      .select('*')
      .eq('authId', id)
      .is('deletedAt', null)
      .maybeSingle());
    if (error) throw error;
    return data;
  }

  private async findAccountUserById(id: string | number) {
    const client = this.supabaseService.client;
    const { data, error } = await client
      .schema('account')
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deletedAt', null)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  private async tryLocalJwt(request: any, token: string): Promise<boolean> {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Not authorized, token failed');
    }

    const decoded = jwt.verify(token, secret) as { id?: string | number; accountTable?: string };
    if (!decoded.id) {
      throw new UnauthorizedException('Not authorized, token failed');
    }

    const decodedId = String(decoded.id);
    let user: any = null;
    let mapper = (value: any) => this.mapProfileUser(value);

    if (decoded.accountTable === 'users' || !UUID_PATTERN.test(decodedId)) {
      user = await this.findAccountUserById(decoded.id);
      mapper = (value: any) => this.mapAccountUser(value);
    } else {
      user = await this.findProfileById(decodedId);
      if (!user && /^\d+$/.test(decodedId)) {
        user = await this.findAccountUserById(decoded.id);
        mapper = (value: any) => this.mapAccountUser(value);
      }
    }

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    request.user = mapper(user);
    request.accessToken = token;
    return true;
  }

  private mapProfileUser(user: any) {
    return {
      id: user.id,
      _id: String(user.id),
      supabaseId: user.id,
      supabase_id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      address: user.address || '',
      dob: user.dob || '',
      profile_picture: user.profile_picture || null,
      two_factor_enabled: false,
      is_verified: user.is_verified ?? false,
      created_at: user.created_at || '',
      account_table: 'profiles',
    };
  }

  private mapAccountUser(user: any) {
    const fullName = user.name || user.full_name || '';
    const firstName = user.first_name || user.firstName || fullName.split(' ')[0] || '';
    const lastName = user.last_name || user.lastName || fullName.split(' ').slice(1).join(' ') || '';
    return {
      id: user.id,
      _id: String(user.id),
      supabaseId: user.supabaseId,
      supabase_id: user.supabaseId,
      full_name: fullName,
      name: fullName,
      first_name: firstName,
      last_name: lastName,
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      dob: user.dateOfBirth,
      profile_picture: user.profilePicture,
      profilePicture: user.profilePicture,
      two_factor_enabled: false,
      twoFactorEnabled: false,
      is_verified: user.isVerified,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      created_at: user.createdAt,
      account_table: 'users',
    };
  }
}
