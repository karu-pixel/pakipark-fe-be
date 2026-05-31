import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { LegacyApiModule } from './legacy-api/legacy-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    SupabaseModule,
    AuthModule,
    VehicleModule,
    LegacyApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
