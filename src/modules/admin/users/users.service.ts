import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/models/user.model';
import { Profile } from 'src/database/models/profile.model';
import { Role } from 'src/database/models/role.model';
import { UserRoles } from 'src/database/models/userRoles.model';
import { ConsultantDocument } from 'src/database/models/consultantDocuments.model';
import { ConsultantSpecialty } from 'src/database/models/consultantSpecialties.model';
import { Op } from 'sequelize';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { SpecialtiesMst } from 'src/database/models/specialtiesMst.model';
import { ConsultantMailConfig } from 'src/modules/mail/consultant-mail-config';
import { UpdateConsultantDto } from './dto/update-user.dto';
import { paginate } from 'src/common/utils/pagination.util';
import { MailService } from 'src/modules/mail/mail-sendgrid.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Profile) private readonly profileModel: typeof Profile,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(UserRoles) private readonly userRoleModel: typeof UserRoles,
    @InjectModel(ConsultantDocument) private readonly documentModel: typeof ConsultantDocument,
    @InjectModel(ConsultantSpecialty) private readonly specialtyModel: typeof ConsultantSpecialty,
    @InjectModel(SpecialtiesMst) private specialtymasterModel: typeof SpecialtiesMst,
    private readonly mailService: MailService
  ) { }


  async findAll(query: PaginationDto) {
    try {
      let { page = 1, limit = 10, search = '', role, status } = query;

      const where: any = {};

      // 🔍 Search filter
      if (search) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      // 🟢 Status filter
      if (status) where.status = status;

      // 🎭 Role filter logic
      let roleFilter: number[] = [];
      if (role?.toUpperCase() === 'CONSULTANT') {
        roleFilter = [2];
      } else if (role?.toUpperCase() === 'USER') {
        roleFilter = [3];
      } else {
        roleFilter = [2, 3];
      }

      // 👥 Include relation for roles
      const include = [
        {
          model: this.roleModel,
          where: { id: { [Op.in]: roleFilter } },
          through: { attributes: [] },
        },
      ];

      const result = await paginate(this.userModel, { page, limit }, include, where);

      return { statusCode: 200, message: 'Users fetched successfully', data: result, };
    } catch (err) {
      console.error('Error fetching users:', err);
      throw new BadRequestException('Failed to fetch users');
    }
  }


  async updateConsultant(userId: number, options: UpdateConsultantDto) {
    const consultant = await this.userModel.findOne({
      where: { id: userId },
      include: [
        {
          model: this.roleModel,
          where: { id: 2 },
          through: { attributes: [] },
        },
      ],
    });

    if (!consultant) {
      throw new NotFoundException('Consultant not found or not a consultant');
    }

    let mailType = null;

    if (options.isVerified !== undefined) {
      consultant.isVerified = options.isVerified;
      mailType = options.isVerified ? ConsultantMailConfig.VERIFIED : ConsultantMailConfig.UNVERIFIED;
    }

    if (options.status) {
      consultant.status = options.status;
      if (!mailType) { mailType = ConsultantMailConfig[options.status] }
    }

    await consultant.save();

    if (mailType) {
      await this.mailService.sendMailTemplate({
        to: consultant.email,
        templateName: 'consultant-status-update.html',
        context: {
          fullName: consultant.fullName,
          title: mailType.title,
          message: mailType.message,
          statusColor: mailType.statusColor,
        },
        sendAsync: true,
      });
    }

    return {
      statusCode: 200,
      message: 'Consultant updated successfully',
    };
  }

  async findOne(userId: number) {
    try {
      const user = await this.userModel.findOne({
        where: { id: userId },
        include: [
          { model: this.profileModel },
          {
            model: this.roleModel,
            through: { attributes: [] },
          },
          {
            model: this.documentModel,
            attributes: ['id', 'documentType', 'fileUrl', 'parsedData']
          },
          {
            model: this.specialtyModel,
            attributes: ['id'],
            include: [{ model: this.specialtymasterModel, attributes: ['name'] }]
          },
        ],
      });

      if (!user) throw new NotFoundException('User not found');

      return {
        statusCode: 200,
        message: 'User fetched successfully',
        data: user,
      };
    } catch (err) {
      console.error('Error fetching user by ID:', err);
      throw new BadRequestException('Failed to fetch user');
    }
  }


}
