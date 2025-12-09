import { Controller, InternalServerErrorException, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('File Upload')
@Controller('')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @UseGuards(JwtRolesGuard)
    @Roles(2)
    @Post('resume/parse')
    @UseInterceptors(FileInterceptor('file'))
    async uploadResume(@UploadedFile() file: Express.Multer.File,) {
        if (!file) {
            throw new InternalServerErrorException('File is required');
        }
        return await this.uploadService.resumeParser(file);

    }

}
