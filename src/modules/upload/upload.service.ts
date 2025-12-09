import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AffindaService } from '../affinda/affinda.service';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantDocument } from 'src/database/models/consultantDocuments.model';
import { transformResumeResponse } from 'src/common/helper/resume-parser';
import { DigitaloceanService } from 'src/services/digitalocean.service';
@Injectable()
export class UploadService {
    constructor(
        private readonly affindaService: AffindaService,
        private readonly digitalOcean: DigitaloceanService,
        @InjectModel(ConsultantDocument) private documentModel: typeof ConsultantDocument,
    ) { }
    async resumeParser(file: any) {
        const fileUrl = await this.digitalOcean.uploadSingle(file);
        const parsedData = await this.affindaService.parseFromStream(fileUrl);
        const data = transformResumeResponse(parsedData)

        return { statusCode: 200, message: 'Resume uploaded and parsed successfully', data: { fileUrl, ...data }, };


    }

}
