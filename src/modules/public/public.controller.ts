import {
  Controller,
  Get,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { GetConsultantsQueryDto, searchDto } from 'src/common/dtos/pagination.dto';

@ApiTags('Public')
@Controller('')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
  ) { }

  @Get('specialties')
  @ApiOperation({ summary: 'Get list of specialties' })
  async getSpecialties() {
    return this.publicService.getSpecialties();
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Get list of currencies' })
  async getCurrecncy() {
    return this.publicService.getCurrecncy();
  }

  @Get('consultants')
  @ApiResponse({ status: 200, description: 'List of consultants with pagination' })
  async getAllConsultants(@Query() query: GetConsultantsQueryDto) {
    return this.publicService.getAllConsultants(query);
  }

}
