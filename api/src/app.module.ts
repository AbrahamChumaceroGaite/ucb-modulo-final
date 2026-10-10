import { Module } from '@nestjs/common';
import { CoreModule } from './libs/core.module';
import { PrediccionVencimientoModule } from './contexts/prediccion_vencimiento/prediccion_vencimiento.module';

@Module({
  imports: [CoreModule, PrediccionVencimientoModule],
})
export class AppModule {}
