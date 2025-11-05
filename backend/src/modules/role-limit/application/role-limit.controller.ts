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
import { RoleLimitService } from './role-limit.service';
import { CreateRoleLimitDto } from './dto/create-role-limit.dto';
import { UpdateRoleLimitDto } from './dto/update-role-limit.dto';
import { RoleLimitResponseDto } from './dto/role-limit-response.dto';

@ApiTags('role-limits')
@Controller('role-limits')
export class RoleLimitController {
  constructor(private readonly roleLimitService: RoleLimitService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new role limit' })
  @ApiResponse({
    status: 201,
    description: 'Role limit created successfully',
    type: RoleLimitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Role limit already exists' })
  async create(@Body() createRoleLimitDto: CreateRoleLimitDto): Promise<RoleLimitResponseDto> {
    const roleLimit = await this.roleLimitService.create(createRoleLimitDto);
    return RoleLimitResponseDto.fromDomain(roleLimit);
  }

  @Get()
  @ApiOperation({ summary: 'Get all role limits' })
  @ApiResponse({
    status: 200,
    description: 'List of role limits',
    type: [RoleLimitResponseDto],
  })
  async findAll(): Promise<RoleLimitResponseDto[]> {
    const roleLimits = await this.roleLimitService.findAll();
    return roleLimits.map(roleLimit => RoleLimitResponseDto.fromDomain(roleLimit));
  }

  @Get(':role')
  @ApiOperation({ summary: 'Get a role limit by role key' })
  @ApiParam({ name: 'role', description: 'Role key' })
  @ApiResponse({
    status: 200,
    description: 'Role limit found',
    type: RoleLimitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role limit not found' })
  async findOne(@Param('role') role: string): Promise<RoleLimitResponseDto> {
    const roleLimit = await this.roleLimitService.findOne(role);
    return RoleLimitResponseDto.fromDomain(roleLimit);
  }

  @Put(':role')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a role limit' })
  @ApiParam({ name: 'role', description: 'Role key' })
  @ApiResponse({
    status: 200,
    description: 'Role limit updated successfully',
    type: RoleLimitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role limit not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('role') role: string,
    @Body() updateRoleLimitDto: UpdateRoleLimitDto,
  ): Promise<RoleLimitResponseDto> {
    const roleLimit = await this.roleLimitService.update(role, updateRoleLimitDto);
    return RoleLimitResponseDto.fromDomain(roleLimit);
  }

  @Delete(':role')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a role limit' })
  @ApiParam({ name: 'role', description: 'Role key' })
  @ApiResponse({ status: 204, description: 'Role limit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role limit not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('role') role: string): Promise<void> {
    await this.roleLimitService.remove(role);
  }

  @Get('stats/count')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get role limit count statistics' })
  @ApiResponse({
    status: 200,
    description: 'Role limit count',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async count(): Promise<{ count: number }> {
    const count = await this.roleLimitService.count();
    return { count };
  }
}
