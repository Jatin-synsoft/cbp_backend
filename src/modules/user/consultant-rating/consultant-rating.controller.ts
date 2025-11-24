import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ConsultantRatingService } from './consultant-rating.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateRatingDto } from './dto/create-consultant-rating.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Consultant Rating')
@ApiBearerAuth()
@UseGuards(JwtRolesGuard)
@Roles(3)
@Controller('rating')
export class ConsultantRatingController {
  constructor(private readonly ratingService: ConsultantRatingService) { }

  @Post()
  @ApiOperation({ summary: 'Submit rating for a completed booking' })
  async createRating(@GetUser() user: any, @Body() dto: CreateRatingDto) {
    return this.ratingService.createRating(user.id, dto);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get rating details by booking ID' })
  async getRatingByBookingId(@Param('bookingId', ParseIntPipe) bookingId: number,) {
    return this.ratingService.getRatingByBookingId(bookingId);
  }
}
