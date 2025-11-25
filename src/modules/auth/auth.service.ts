import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/models/user.model';
import { Profile } from 'src/database/models/profile.model';
import { Role } from 'src/database/models/role.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SignupDto } from './dto/signup.dto';
import { UserRoles } from 'src/database/models/userRoles.model';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConsultantDocument } from 'src/database/models/consultantDocuments.model';
import { ConsultantSpecialty } from 'src/database/models/consultantSpecialties.model';
import { STATUS_MESSAGES } from 'src/common/enums/status-messages';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { AffindaService } from '../affinda/affinda.service';
import { Op } from 'sequelize';
import { SpecialtiesMst } from 'src/database/models/specialtiesMst.model';
import { Currency } from 'src/database/models/currencies.model';
import { StripeService } from 'src/stripe/stripe.service';
import { MailService } from '../mail/mail-sendgrid.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Profile) private profileModel: typeof Profile,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(UserRoles) private userRoleModel: typeof UserRoles,
    @InjectModel(ConsultantDocument) private documentModel: typeof ConsultantDocument,
    @InjectModel(ConsultantSpecialty) private specialtyModel: typeof ConsultantSpecialty,
    @InjectModel(SpecialtiesMst) private specialtymasterModel: typeof SpecialtiesMst,
    private readonly mailService: MailService,
    private readonly affindaService: AffindaService,
    private readonly stripeService: StripeService
  ) { }

  async register(dto: SignupDto) {
    const existing = await this.userModel.findOne({
      where: {
        [Op.or]: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new BadRequestException('Email already exists');
      }
      if (existing.phone === dto.phone) {
        throw new BadRequestException('Phone number already exists');
      }
    }


    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone,
      status: UserStatus.PENDING_VERIFICATION,
    });

    const roleId = dto.role === 'CONSULTANT' ? 2 : 3;

    await this.userRoleModel.create({ userId: user.id, roleId });

    let profile = await this.profileModel.create({
      userId: user.id,
      street: dto.street,
      city: dto.city,
      state: dto.state,
      zipcode: dto.zipcode,
      qualification: dto.qualification,
      expertise: dto.expertise,
    });

    if (dto.role === 'CONSULTANT') {
      const account = await this.stripeService.createConnectedAccount(user.email);
      if (account.id) {
        profile.stripeAccountId = account.id;
        await profile.save();
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' },);
    const verifyEmailUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;
    this.mailService.sendMailTemplate({
      to: user.email,
      templateName: 'verify-email.html',
      context: { fullName: user.fullName, verifyEmailUrl },
      sendAsync: true,
    });


    this.mailService.sendMailTemplate({
      templateName: 'new-user-alert.html',
      context: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: dto.role.toLowerCase(),
      },
      sendAsync: true,
    });



    return {
      message: 'User registered successfully. Please check your email for verification link.',
      data: { userId: user.id, email: user.email, status: user.status },
    };
  }

  async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: number; email: string };

      const user = await this.userModel.findByPk(decoded.userId, {
        include: [{ model: this.roleModel }],
      });
      if (!user) throw new NotFoundException('User not found');

      if (user.status === UserStatus.ACTIVE) {
        const role = user.roles?.[0]?.name || 'user';
        return { message: 'Email already verified', role };
      }

      user.status = UserStatus.ACTIVE;
      await user.save();

      const role = user.roles?.[0]?.name || 'user';

      return {
        message: 'Email verified successfully',
        role,
      };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  private async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({
      where: { email },
      include: [
        { model: this.roleModel },
        { model: this.profileModel },
        { model: this.documentModel },
        { model: this.specialtyModel },
      ],
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.INACTIVE) {
      const msg = STATUS_MESSAGES[user.status] || 'Invalid user status.';
      throw new UnauthorizedException(msg);
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      const msg = STATUS_MESSAGES[user.status] || 'Invalid user status.';
      throw new UnauthorizedException(msg);
    }
    const isConsultant = user.roles?.some(r => r.id === 2);
    const hasDocsOrSpecialties =
      (user.consultantDocuments?.length > 0) ||
      (user.consultantSpecialties?.length > 0);

    if (isConsultant) {
      if (!hasDocsOrSpecialties) {
        return user.toJSON();
      }

      if (!user.isVerified) {
        throw new ForbiddenException('Profile under review. Please wait for approval.');
      }
    } else {
      if (user.status !== UserStatus.ACTIVE) {
        const msg = STATUS_MESSAGES[user.status] || 'Invalid user status.';
        throw new UnauthorizedException(msg);
      }
    }

    return user.toJSON();

  }

  private async generateToken(user: any) {
    const hasDocsOrSpecialties =
      (user.consultantDocuments?.length > 0) ||
      (user.consultantSpecialties?.length > 0);

    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.id) || [],
      status: user.status,
      isVerified: user.isVerified,
      isNewUser: !hasDocsOrSpecialties
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const firstRole = user.roles?.[0] || null;
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles?.map((r) => ({ id: r.id, name: r.name })) || [],
        role: firstRole?.name,
        status: user.status,
        isVerified: user.isVerified,
      },
    };
  }

  async loginAdminOrConsultant(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const roles = user.roles?.map((r) => Number(r.id)) || [];

    if (!roles.some(roleId => [1, 2, 3].includes(roleId))) {
      throw new UnauthorizedException('Not authorized to login');
    }

    const result = await this.generateToken(user);
    return {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    };
  }

  async getUserProfileById(userId: number) {
    const user = await this.userModel.findOne({
      where: { id: userId },
      attributes: ['id', 'email', 'fullName', 'phone', 'status', 'isVerified'],
      include: [
        {
          model: Role,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Profile,
          attributes: [
            'street',
            'city',
            'state',
            'zipcode',
            'qualification',
            'expertise',
            'references',
            'hourlyRate',
            'stripeAccountId',
            'stripeAccountStatus'
          ],
          include: [
            {
              model: Currency,
              attributes: ['id', 'name', 'symbol']
            }
          ]
        },
        {
          model: ConsultantDocument,
          attributes: ['id', 'documentType', 'fileUrl', 'parsedData'],
        },
        {
          model: ConsultantSpecialty,
          attributes: ['id', 'specialtyId'],
          // include: [{ model: SpecialtiesMst, attributes: ['id', 'name',] }],
        },
      ],
    });

    if (!user) throw new NotFoundException('User not found');

    const userJson = user.toJSON();

    // ✅ Take only the first role
    const firstRole = userJson.roles?.[0] || null;
    userJson.role = firstRole ? firstRole.name : 'consultant';

    // if (userJson.consultantDocuments.length > 0) {
    //   const cvDoc = userJson.consultantDocuments.find(
    //     (doc: any) => doc.documentType === 'CV'
    //   );

    //   if (cvDoc) {
    //     userJson.profile = {
    //       ...userJson.profile,
    //       ...cvDoc.parsedData,
    //       fileUrl: cvDoc.fileUrl,
    //     };
    //   }

    //   delete cvDoc.parsedData;
    // }


    return {
      message: 'User profile fetched successfully',
      data: userJson,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userModel.findByPk(userId, {
      include: [{ model: this.roleModel }],
    });

    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.phone) user.phone = dto.phone;
    await user.save();

    const profile = await this.profileModel.findOne({ where: { userId } });
    if (profile) {
      await profile.update(dto);
    }

    if (user.roles?.some(r => r.id === 2)) {
      if (dto.specialties) {
        await this.specialtyModel.destroy({ where: { userId } });
        const specialtiesToCreate = dto.specialties.map(id => ({ userId, specialtyId: id }));
        await this.specialtyModel.bulkCreate(specialtiesToCreate);
      }
      const resumeRecord = await this.documentModel.findOne({ where: { userId, documentType: 'CV' } });

      const parsedData = {
        summary: dto.summary || null,
        education: dto.education || null,
        workExperience: dto.workExperience || null,
        projects: dto.projects || null,
      };

      const isFirstTimeResumeUpdate = !resumeRecord || !resumeRecord.parsedData || Object.values(resumeRecord.parsedData).every(v => v == null);

      if (resumeRecord) {
        resumeRecord.parsedData = parsedData ?? resumeRecord.parsedData;
        resumeRecord.fileUrl = dto.fileUrl ?? resumeRecord.fileUrl;
        await resumeRecord.save();
      } else {
        await this.documentModel.create({
          userId,
          documentType: 'CV',
          fileUrl: dto.fileUrl,
          parsedData,
        });
      }

      if (isFirstTimeResumeUpdate) {
        this.mailService.sendMailTemplate({
          templateName: 'profile-complete.html',
          context: {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.roles[0].name.toLowerCase(),
          },
          sendAsync: true,
        });
      }
    }
    return { message: 'Profile updated successfully' };
  }


  async seedSuperAdmin() {
    // 1️⃣ Check if Super Admin already exists
    const existingAdmin = await this.userModel.findOne({
      where: { email: process.env.SUPER_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('⚠️ Super Admin already exists');
      return { message: 'Super Admin already exists' };
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);

    // 3️⃣ Create Super Admin User
    const user = await this.userModel.create({
      email: process.env.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      fullName: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      phone: process.env.SUPER_ADMIN_PHONE || '9999999999',
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
    });

    // 4️⃣ Assign Role (Assuming roleId = 1 → ADMIN)
    await this.userRoleModel.create({
      userId: user.id,
      roleId: 1,
    });

    return {
      message: 'Super Admin created successfully',
    };
  }
}  