import * as fs from 'fs';
import { join, basename } from 'path';
import { NotFoundException } from '@nestjs/common';

export function createFileStream(filePath: string): fs.ReadStream {
    const fileName = basename(filePath);
    console.log(`🚀 ~ :7 ~ fileName:-->`, fileName)

    const absolutePath = join(process.cwd(), 'uploads', 'resumes', fileName);
    console.log(`🚀 ~ :9 ~ absolutePath:-->`, absolutePath)

    if (!fs.existsSync(absolutePath)) {
        throw new NotFoundException(`File not found at path: ${absolutePath}`);
    }

    return fs.createReadStream(absolutePath);
}

export function getFileUrl(filePath: string): string {
    const fileName = basename(filePath);
    return `http://192.168.0.175:3000/uploads/resumes/${fileName}`;
}
