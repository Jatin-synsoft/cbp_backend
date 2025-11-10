import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

export function FileUploadInterceptor(fieldName: string, folder = 'uploads') {
    return FileInterceptor(fieldName, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = `./${folder}`;
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${Date.now()}${ext}`);
            },
        }),
    });
}
