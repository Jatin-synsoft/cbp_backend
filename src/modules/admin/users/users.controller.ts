import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto, searchDto } from 'src/common/dtos/pagination.dto';
import { UpdateConsultantDto } from './dto/update-user.dto';

@ApiTags('Admin user management')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(1)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('')
  @ApiOperation({ summary: 'Fetch paginated list of users (protected)' })
  async findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user/consultant by ID (protected)' })
  async findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update consultant by ID (protected)' })
  async updateConsultant(@Param('id') id: number, @Body() body: UpdateConsultantDto) {
    return this.usersService.updateConsultant(id, body);
  }

}
