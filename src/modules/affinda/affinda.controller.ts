import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffindaService } from './affinda.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Affinda')
@Controller('affinda')
export class AffindaController {
  constructor(private readonly affindaService: AffindaService) { }

  // @Post('parse-url')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       fileUrl: { type: 'string', example: 'https://example.com/document.pdf' },
  //     },
  //     required: ['fileUrl'],
  //   },
  // })
  // async parseFromUrl(@Body('fileUrl') fileUrl: string,) {
  //   const data = await this.affindaService.parseFromUrl(fileUrl);
  //   return { data };
  // }
}
