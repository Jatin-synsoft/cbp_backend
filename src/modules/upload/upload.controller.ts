import { Body, Controller, InternalServerErrorException, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AzureService } from '../azure/azure.service';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import { ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UploadResumeDto } from './dto/upload-resume.dto';

@ApiTags('File Upload')
@Controller('')
export class UploadController {
    constructor(private readonly azureService: AzureService, private readonly uploadService: UploadService) { }

    // @Post()
    // @UseInterceptors(FileInterceptor('file'))
    // async azurefileUpload(@UploadedFile() file: Express.Multer.File) {
    //     const url = await this.azureService.uploadFile(file);
    //     return { url };
    // }

    @UseGuards(JwtRolesGuard)
    @Roles(2)
    @Post('resume/parse')
    @UseInterceptors(FileUploadInterceptor('file', 'uploads/resumes'))
    async uploadResume(@GetUser() user: any, @UploadedFile() file: Express.Multer.File,) {
        if (!file) {
            throw new InternalServerErrorException('File is required');
        }
        return await this.uploadService.resumeParser(file, user.id);

    }

    @Post('upload/file')
    @UseInterceptors(FileUploadInterceptor('file', 'uploads/resumes'))
    async uploadFile(@UploadedFile() file: Express.Multer.File,) {
        return this.uploadService.uploadFile(file);
    }

}
