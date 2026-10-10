import { Module } from '@nestjs/common';
import { AuthModule } from './contexts/auth/auth.module';
import { ExpiryRiskModule } from './contexts/expiry_risk/expiry_risk.module';
import { CoreModule } from './libs/core.module';

@Module({
  imports: [CoreModule, AuthModule, ExpiryRiskModule],
})
export class AppModule {}
