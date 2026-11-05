import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // Super Admin routes
  @Get('platform/overview')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getPlatformStats() {
    return this.tenantsService.getPlatformStats();
  }

  @Get('platform/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getAllTenants() {
    return this.tenantsService.findAllTenants();
  }

  @Put('platform/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  toggleStatus(@Param('id') tenantId: string, @Body() body: { status: 'ACTIVE' | 'SUSPENDED' }) {
    return this.tenantsService.toggleTenantStatus(tenantId, body.status);
  }

  // Tenant Owner settings
  @Get('current')
  getCurrentTenant(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getTenantDetails(tenantId);
  }

  @Put('current')
  updateCurrentTenant(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.tenantsService.updateTenantSettings(tenantId, dto);
  }

  @Get('users')
  getTenantUsers(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getTenantUsers(tenantId);
  }

  @Post('users')
  createTenantUser(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.tenantsService.createTenantUser(tenantId, dto);
  }
}
