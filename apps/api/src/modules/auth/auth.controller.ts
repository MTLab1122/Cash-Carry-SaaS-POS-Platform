import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string; tenantSlug?: string }) {
    return this.authService.login(body);
  }

  @Post('register-tenant')
  async registerTenant(
    @Body()
    body: {
      businessName: string;
      slug: string;
      ownerName: string;
      email: string;
      password: string;
      phone: string;
      city?: string;
      country?: string;
      ntn?: string;
      strn?: string;
    },
  ) {
    return this.authService.registerTenant(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string; tenantSlug?: string }) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}

