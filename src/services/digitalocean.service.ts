import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class DigitaloceanService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: new AWS.Endpoint(process.env.SPACES_ENDPOINT),
      region: process.env.SPACES_REGION,
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_SECRET,
      signatureVersion: 'v4',
    });
  }

  async uploadSingle(file: Express.Multer.File) {
    const filename = `${Date.now()}.${file.originalname.split('.').pop()}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: `${process.env.SPACES_BUCKET}/cv`,
      Key: filename,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    const uploaded = await this.s3.upload(params).promise();
    return uploaded.Location;
  }
}
