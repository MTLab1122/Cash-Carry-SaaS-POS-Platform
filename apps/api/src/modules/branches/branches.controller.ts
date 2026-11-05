import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.findAll(tenantId);
  }

  @Post()
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.branchesService.create(tenantId, dto);
  }

  @Get(':id/registers')
  getRegisters(@Param('id') branchId: string) {
    return this.branchesService.getRegisters(branchId);
  }

  @Post(':id/registers')
  createRegister(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') branchId: string,
    @Body() body: { name: string; terminalCode: string },
  ) {
    return this.branchesService.createRegister(tenantId, branchId, body);
  }
}

