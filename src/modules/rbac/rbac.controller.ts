import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HierarchicalRoleService } from './hierarchical-role.service';
import { HierarchicalGuard } from '~core/guards/hierarchical.guard';
import { RequirePermission, RequireRole, CurrentUser } from '~core/decorators/auth';
import { PermissionAction, PermissionResource } from '~shared/entities/permission.entity';
import { AuthUserDto } from '~shared/dto/auth';

@ApiTags('RBAC')
@Controller('rbac')
@ApiBearerAuth()
@UseGuards(HierarchicalGuard)
export class RbacController {
  private readonly hierarchicalRoleService: HierarchicalRoleService;

  constructor(hierarchicalRoleService: HierarchicalRoleService) {
    this.hierarchicalRoleService = hierarchicalRoleService;
  }

  @Get('user/:userId/permissions')
  @RequirePermission(PermissionAction.READ, PermissionResource.USER)
  @ApiOperation({ summary: 'Get user permissions and roles' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  async getUserPermissions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.hierarchicalRoleService.getUserPermissions(userId);
  }

  @Get('my-permissions')
  @ApiOperation({ summary: 'Get current user permissions and roles' })
  @ApiResponse({ status: 200, description: 'Current user permissions retrieved successfully' })
  async getMyPermissions(@CurrentUser() user: AuthUserDto) {
    return this.hierarchicalRoleService.getUserPermissions(user.id);
  }

  @Post('role-hierarchy')
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.ROLE)
  @ApiOperation({ summary: 'Create role hierarchy relationship' })
  @ApiResponse({ status: 201, description: 'Role hierarchy created successfully' })
  async createRoleHierarchy(@Body() body: { parentRoleId: string; childRoleId: string }) {
    return this.hierarchicalRoleService.createRoleHierarchy(body.parentRoleId, body.childRoleId);
  }

  @Delete('role-hierarchy/:parentRoleId/:childRoleId')
  @RequirePermission(PermissionAction.MANAGE, PermissionResource.ROLE)
  @ApiOperation({ summary: 'Remove role hierarchy relationship' })
  @ApiResponse({ status: 200, description: 'Role hierarchy removed successfully' })
  async removeRoleHierarchy(
    @Param('parentRoleId', ParseUUIDPipe) parentRoleId: string,
    @Param('childRoleId', ParseUUIDPipe) childRoleId: string,
  ) {
    await this.hierarchicalRoleService.removeRoleHierarchy(parentRoleId, childRoleId);
    return { message: 'Role hierarchy removed successfully' };
  }

  @Get('role/:roleId/hierarchy')
  @RequirePermission(PermissionAction.READ, PermissionResource.ROLE)
  @ApiOperation({ summary: 'Get role hierarchy information' })
  @ApiResponse({ status: 200, description: 'Role hierarchy retrieved successfully' })
  async getRoleHierarchy(@Param('roleId', ParseUUIDPipe) roleId: string) {
    return this.hierarchicalRoleService.getRoleHierarchy(roleId);
  }

  @Get('admin-only')
  @RequireRole('Admin')
  @ApiOperation({ summary: 'Admin only endpoint example' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  adminOnly() {
    return { message: 'This endpoint is only accessible by Admins' };
  }

  @Get('manager-and-above')
  @RequireRole('Manager')
  @ApiOperation({ summary: 'Manager and above endpoint example' })
  @ApiResponse({ status: 200, description: 'Manager access granted' })
  managerAndAbove() {
    return { message: 'This endpoint is accessible by Managers and their parent roles' };
  }
}
