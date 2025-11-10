import { Module } from '@nestjs/common';
import { AffindaService } from './affinda.service';
import { AffindaController } from './affinda.controller';

@Module({
  controllers: [AffindaController],
  providers: [AffindaService],
  exports: [AffindaService]
})
export class AffindaModule { }
