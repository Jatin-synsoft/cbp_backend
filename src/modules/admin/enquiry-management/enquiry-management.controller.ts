import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { EnquiryManagementService } from './enquiry-management.service';
import { CreateEnquiryManagementDto } from './dto/create-enquiry-management.dto';
import { UpdateEnquiryManagementDto } from './dto/update-enquiry-management.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BasePaginationDto, PaginationDto } from 'src/common/dtos/pagination.dto';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Enquiry Management')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(1)
@Controller('enquiry')
export class EnquiryManagementController {
  constructor(private readonly enquiryService: EnquiryManagementService,) { }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create enquiry (public)' })
  async create(@Body() dto: CreateEnquiryManagementDto) {
    return this.enquiryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated enquiries (admin)' })
  async findAll(@Query() query: BasePaginationDto) {
    return this.enquiryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enquiry by ID (admin)' })
  async findOne(@Param('id') id: number) {
    return this.enquiryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update enquiry (admin)' })
  async update(@Param('id') id: number, @Body() dto: UpdateEnquiryManagementDto,) {
    return this.enquiryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete enquiry (admin)' })
  async remove(@Param('id') id: number) {
    return this.enquiryService.remove(id);
  }
}
