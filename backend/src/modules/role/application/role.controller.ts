import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleService.create(createRoleDto);
    return RoleResponseDto.fromDomain(role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of roles',
    type: [RoleResponseDto],
  })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleService.findAll();
    return roles.map(role => RoleResponseDto.fromDomain(role));
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a role by key' })
  @ApiParam({ name: 'key', description: 'Role key (e.g., premium, free)' })
  @ApiResponse({
    status: 200,
    description: 'Role found',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('key') key: string): Promise<RoleResponseDto> {
    const role = await this.roleService.findOne(key);
    return RoleResponseDto.fromDomain(role);
  }

  @Put(':key')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'key', description: 'Role key (e.g., premium, free)' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('key') key: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleService.update(key, updateRoleDto);
    return RoleResponseDto.fromDomain(role);
  }

  @Delete(':key')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'key', description: 'Role key (e.g., premium, free)' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('key') key: string): Promise<void> {
    await this.roleService.remove(key);
  }

  @Get('stats/count')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get role count statistics' })
  @ApiResponse({
    status: 200,
    description: 'Role count',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async count(): Promise<{ count: number }> {
    const count = await this.roleService.count();
    return { count };
  }
}
