import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/models/user.model';
import { Role } from 'src/database/models/role.model';
import { Op } from 'sequelize';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Role) private readonly roleModel: typeof Role,
  ) { }


  async getUserCounts() {
    try {
      const totalUsers = await this.userModel.count({
        include: [{
          model: Role, through: { attributes: [] },
          where: {
            id: { [Op.ne]: 1 },
          },
        }],

      });
      const consultants = await this.userModel.count({
        include: [{ model: Role, where: { id: 2 }, through: { attributes: [] } }],
      });
      const endUsers = await this.userModel.count({
        include: [{ model: Role, where: { id: 3 }, through: { attributes: [] } }],
      });

      return {
        statusCode: 200,
        message: 'User counts fetched successfully',
        data: {
          totalUsers,
          consultants,
          endUsers,
        },
      };
    } catch (err) {
      console.error('Error fetching user counts:', err);
      throw new BadRequestException('Failed to fetch user counts');
    }
  }

  async getLastUsers() {
    try {
      const users = await this.userModel.findAll({
        limit: 20,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Role, through: { attributes: [] },
            where: {
              id: { [Op.ne]: 1 },
            },
          },
        ],
        attributes: ['id', 'fullName', 'email', 'phone', 'status', 'createdAt'],
      });

      return {
        statusCode: 200,
        message: 'Last 20 users fetched successfully',
        data: users,
      };
    } catch (err) {
      console.error('Error fetching recent users:', err);
      throw new BadRequestException('Failed to fetch recent users');
    }
  }
}
