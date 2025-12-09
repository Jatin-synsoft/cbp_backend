import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AffindaAPI, AffindaCredential } from '@affinda/affinda';

@Injectable()
export class AffindaService {
  private client: AffindaAPI;

  constructor() {
    const apiKey = process.env.AFFINDA_API_KEY;
    if (!apiKey) throw new Error('AFFINDA_API_KEY not set in environment variables');

    const credential = new AffindaCredential(apiKey);
    this.client = new AffindaAPI(credential);
  }

  async parseFromUrl(fileUrl: string) {
    try {
      const workspace = process.env.AFFINDA_WORKSPACE;

      const document = await this.client.createDocument({
        url: fileUrl,
        workspace,
        wait: 'true',
        documentType: 'IUkgTTeH',
        compact: 'true'

      });

      return document.data;
    } catch (err) {
      console.error('Affinda error:', err);
      throw new InternalServerErrorException('Failed to parse document from URL');
    }
  }

  async parseFromStream(file: string) {
    const workspace = process.env.AFFINDA_WORKSPACE;
    const documentType = process.env.AFFINDA_DOCUMENT_TYPE;
    const document = await this.client.createDocument({
      url: file,
      workspace,
      wait: 'true',
      documentType,
      compact: 'true',
      // enableValidationTool: 'true'
    });

    return document.data;

  }
}
