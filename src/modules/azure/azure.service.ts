// azure-blob.service.ts
import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class AzureService {
    private containerClient: ContainerClient;

    constructor() {
        // const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        // const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        // const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        // this.containerClient = blobServiceClient.getContainerClient(containerName);
    }

    async uploadFile(file: Express.Multer.File, blobName?: string) {
        const name = blobName || file.originalname;
        const blockBlobClient = this.containerClient.getBlockBlobClient(name);

        await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        return blockBlobClient.url;
    }
}
