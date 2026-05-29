import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { PublicUserDto, UserListItemDto } from './dto/public-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: PublicUserDto })
  create(@Body() body: CreateUserDto) {
    return this.usersService.createAdminUser(body);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [UserListItemDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('deleted')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all deleted users' })
  @ApiResponse({ status: 200, type: [UserListItemDto] })
  findDeletedUsers() {
    return this.usersService.findDeletedUsers();
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteById(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: PublicUserDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.usersService.updateById(id, body);
  }

  @Patch(':id/promote-admin')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Promote user to admin' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  promoteToAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.promoteToAdmin(id);
  }

  @Patch(':id/toggle-driver-status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Toggle whether user is eligible to be a driver' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  toggleDriverStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleDriverStatus(id);
  }

  @Post(':id/restore')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Restore deleted user' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.restoreUser(id);
  }
}
