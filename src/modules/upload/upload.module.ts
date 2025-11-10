import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { AzureBlobModule } from '../azure/azure.module';
import { AffindaModule } from '../affinda/affinda.module';
import { UploadService } from './upload.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [AffindaModule, AzureBlobModule, DatabaseModule],
    controllers: [UploadController],
    providers: [UploadService],

})
export class UploadModule { }
