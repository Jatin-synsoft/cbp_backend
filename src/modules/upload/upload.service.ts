import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AffindaService } from '../affinda/affinda.service';
import { join } from 'path';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantDocument } from 'src/database/models/consultant-documents.model';
import { transformResumeResponse } from 'src/common/helper/resume-parser';
@Injectable()
export class UploadService {
    constructor(
        private readonly affindaService: AffindaService,
        @InjectModel(ConsultantDocument) private documentModel: typeof ConsultantDocument,
    ) { }

    uploadFile(file: Express.Multer.File): any {
        if (!file) {
            throw new InternalServerErrorException('File is required');
        }

        try {
            // const fileUrl = join(process.cwd(), file.path.replace(/\\/g, '/'));

            const fileUrl = `${process.env.BACKEND_URL}/${file.path.replace(/\\/g, '/')}`;

            return { message: 'File uploaded successfully', data: { fileUrl } };
        } catch (err) {
            console.error('File upload error:', err);
            throw new InternalServerErrorException('Failed to get uploaded file link');
        }
    }

    async resumeParser(file: any, userId: number) {
        try {
            const fileUrl = `${'http://192.168.0.175:3000'}/${file.path.replace(/\\/g, '/')}`;

            const filePath = join(process.cwd(), file.path);
            const fileStream = fs.createReadStream(filePath);

            const parsedData = await this.affindaService.parseFromStream(fileStream);
            // const resumeRecord = await this.documentModel.findOne({ where: { userId, documentType: 'CV' } });
            const data = transformResumeResponse(parsedData)


            // if (resumeRecord) {
            //     resumeRecord.fileUrl = fileUrl;
            //     // resumeRecord.parsedData = data;
            //     await resumeRecord.save();
            // } else {
            //     const resume = await this.documentModel.create({ fileUrl, documentType: 'CV', userId });
            //     // resume.parsedData = data;
            //     await resume.save();
            // }

            return { statusCode: 200, message: 'Resume uploaded and parsed successfully', data: { fileUrl, ...data }, };

        } catch (err) {
            console.error('Resume upload error:', err);
            throw new InternalServerErrorException('Failed to upload or parse resume');
        }
    }

}
