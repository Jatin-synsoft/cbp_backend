import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Enquiry } from 'src/database/models/enquiry.model';
import { CreateEnquiryManagementDto } from './dto/create-enquiry-management.dto';
import { UpdateEnquiryManagementDto } from './dto/update-enquiry-management.dto';
import { BasePaginationDto, PaginationDto } from 'src/common/dtos/pagination.dto';
import { Op } from 'sequelize';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class EnquiryManagementService {
  constructor(
    @InjectModel(Enquiry)
    private readonly enquiryModel: typeof Enquiry,
  ) { }

  // ⭐ PUBLIC: Create enquiry
  async create(dto: CreateEnquiryManagementDto) {
    try {
      const enquiry = await this.enquiryModel.create({ ...dto });
      return {
        statusCode: 201,
        message: 'Enquiry submitted successfully',
        data: enquiry,
      };
    } catch (err) {
      console.error('Create enquiry error:', err);
      throw new BadRequestException('Failed to submit enquiry');
    }
  }

  async findAll(query: BasePaginationDto) {
    try {
      let { page = 1, limit = 10, search = '' } = query;

      const where: any = {};

      if (search) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { Subject: { [Op.like]: `%${search}%` } },
        ];
      }

      const result = await paginate(this.enquiryModel, { page, limit }, [], where);

      return {
        statusCode: 200,
        message: 'Enquiries fetched successfully',
        data: result,
      };
    } catch (err) {
      console.error('Find all enquiries error:', err);
      throw new BadRequestException('Failed to fetch enquiries');
    }
  }

  async findOne(id: number) {
    const enquiry = await this.enquiryModel.findByPk(id);
    return {
      statusCode: 200,
      message: 'Enquiry fetched successfully',
      data: enquiry,
    };
  }

  async update(id: number, dto: UpdateEnquiryManagementDto) {
    const enquiry = await this.enquiryModel.findByPk(id);
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    await enquiry.update(dto);

    return {
      statusCode: 200,
      message: 'Enquiry updated successfully',
    };
  }

  // ⭐ ADMIN: Delete enquiry
  async remove(id: number) {
    const enquiry = await this.enquiryModel.findByPk(id);
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    await enquiry.destroy();

    return {
      statusCode: 200,
      message: 'Enquiry deleted successfully',
    };
  }
}
