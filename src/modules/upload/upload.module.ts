import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { AffindaModule } from '../affinda/affinda.module';
import { UploadService } from './upload.service';
import { DatabaseModule } from 'src/database/database.module';
import { DigitaloceanService } from 'src/services/digitalocean.service';

@Module({
    imports: [AffindaModule, DatabaseModule],
    controllers: [UploadController],
    providers: [UploadService, DigitaloceanService],

})
export class UploadModule { }
