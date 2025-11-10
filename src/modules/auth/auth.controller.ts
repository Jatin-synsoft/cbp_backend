import { Controller, Post, Body, Put, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRolesGuard } from 'src/common/Guards/roles.guard';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user or consultant' })
  @ApiResponse({ status: 201, description: 'Successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.register(dto);
  }

  @Get('profile')
  @UseGuards(JwtRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in user profile' })
  async getMyProfile(@GetUser() user: any,) {
    const userId = user['id'];
    return this.authService.getUserProfileById(userId);
  }

  @Put('profile')
  @UseGuards(JwtRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user / consultant profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@GetUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }


  @Post('login')
  @ApiOperation({ summary: 'Login for Super Admin and Vendor' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginAdminOrConsultant(
      loginDto.email,
      loginDto.password,
    );
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email from verification link' })
  @ApiQuery({ name: 'token', required: true, description: 'JWT email verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.authService.verifyEmail(token);
      return res.redirect(`${process.env.FRONTEND_URL}`);
    } catch (err) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }
  }


  @Post('seed-super-admin')
  @ApiOperation({ summary: 'Seed Super Admin (one-time setup)' })
  async seedSuperAdmin() {
    return this.authService.seedSuperAdmin();
  }
}
