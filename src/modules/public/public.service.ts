import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePublicDto } from './dto/create-public.dto';
import { UpdatePublicDto } from './dto/update-public.dto';
import { User } from 'src/database/models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Profile } from 'src/database/models/profile.model';
import { Role } from 'src/database/models/role.model';
import { UserRoles } from 'src/database/models/userRoles.model';
import { ConsultantDocument } from 'src/database/models/consultantDocuments.model';
import { ConsultantSpecialty } from 'src/database/models/consultantSpecialties.model';
import { SpecialtiesMst } from 'src/database/models/specialtiesMst.model';
import { Op, Sequelize } from 'sequelize';
import { Currency } from 'src/database/models/currencies.model';
import { paginate } from 'src/common/utils/pagination.util';
import { GetConsultantsQueryDto } from 'src/common/dtos/pagination.dto';
import { ConsultantRating } from 'src/database/models/consultantRating.model';

@Injectable()
export class PublicService {

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Profile) private profileModel: typeof Profile,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(UserRoles) private userRoleModel: typeof UserRoles,
    @InjectModel(ConsultantDocument) private documentModel: typeof ConsultantDocument,
    @InjectModel(ConsultantSpecialty) private specialtyModel: typeof ConsultantSpecialty,
    @InjectModel(SpecialtiesMst) private specialtymasterModel: typeof SpecialtiesMst,
    @InjectModel(Currency) private currencyModel: typeof Currency,
    @InjectModel(ConsultantRating) private ratingModel: typeof ConsultantRating
  ) { }

  async getSpecialties() {
    const specialties = await this.specialtymasterModel.findAll({
      order: [['name', 'ASC']], // Alphabetical order
    });

    return {
      statusCode: 200,
      message: 'Specialties fetched successfully',
      data: specialties,
    };
  }


  async getCurrecncy() {
    const currency = await this.currencyModel.findAll();
    return {
      statusCode: 200,
      message: 'Currencies fetched successfully',
      data: currency,
    };
  }


  async getAllConsultants(query: GetConsultantsQueryDto) {
    const { search, skills, specialtyId } = query;

    const where: any = {
      isVerified: true,
      status: 'ACTIVE',
    };

    const include: any[] = [
      {
        model: this.roleModel,
        attributes: ['id', 'name'],
        through: { attributes: [] },
        where: { id: 2 },
      },
      {
        model: this.profileModel,
        attributes: ['qualification', 'skills', 'city', 'state', 'hourlyRate', 'currencyId', 'stripeAccountId', 'stripeAccountStatus', 'timeZone'],
        where: {
          [Op.and]: [],
        },
        include: [
          {
            model: this.currencyModel,
            attributes: ['id', 'name', 'symbol']
          }
        ]
      },
      {
        model: this.documentModel,
        attributes: ['parsedData'],
      },
      {
        model: this.specialtyModel,
        attributes: ['specialtyId'],
        where: specialtyId
          ? { specialtyId: { [Op.in]: Array.isArray(specialtyId) ? specialtyId : [specialtyId] } }
          : undefined,
        required: !!specialtyId,
        include: [
          {
            model: this.specialtymasterModel,
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: this.ratingModel,
        as: 'receivedRatings',
        attributes: ['note', 'rating', 'userId', 'createdAt'],
      }

    ];

    if (search) {
      const profileInclude = include.find((i) => i.model === this.profileModel);

      // ✅ Combine fullName + JSON skills + other fields into one OR group
      const searchCondition = {
        [Op.or]: [
          // Match fullName (from main user table)
          { fullName: { [Op.like]: `%${search}%` } },

          // ✅ Search inside profile fields
          // Sequelize.literal(
          //   `(JSON_SEARCH(LOWER(profile.skills), 'one', '%${search.toLowerCase()}%') IS NOT NULL 
          //     OR profile.qualification LIKE '%${search}%'
          //     OR profile.city LIKE '%${search}%'
          //     OR profile.state LIKE '%${search}%')`
          // ),
        ],
      };

      // Merge condition into main where (so it searches across user + profile)
      Object.assign(where, searchCondition);
    }

    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      const profileInclude = include.find((i) => i.model === this.profileModel);

      if (profileInclude) {
        const orConditions = skillArray.map(
          (skill) =>
            Sequelize.literal(
              `JSON_SEARCH(LOWER(skills), 'one', '%${skill.toLowerCase()}%') IS NOT NULL`
            )
        );

        profileInclude.where[Op.and].push({ [Op.or]: orConditions });
      }
    }

    const result = await paginate(
      this.userModel,
      query,
      include,
      where,
      [
        'id',
        'email',
        'fullName',
        'phone',
        'status',
        'isVerified',
        [
          Sequelize.literal(`(
              SELECT 
                COALESCE(
                  ROUND( 
                    AVG(rating), 
                    1
                  ), 
                  0
                )
              FROM consultant_ratings
              WHERE consultant_ratings.consultantId = User.id
            )`),
          'averageRating'
        ]

      ]
    );

    return {
      message: 'Consultants fetched successfully',
      data: result,
    };
  }
}
