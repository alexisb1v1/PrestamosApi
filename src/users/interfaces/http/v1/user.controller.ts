import { Body, Controller, Delete, Get, Param, Put, HttpStatus, HttpException, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ListUsersQuery } from '../../../application/queries/v1/list-users.query';
import { GetUserQuery } from '../../../application/queries/v1/get-user.query';
import { UpdateUserCommand } from '../../../application/commands/v1/update-user.command';
import { DeleteUserCommand } from '../../../application/commands/v1/delete-user.command';
import { UpdateUserDto } from './dto/update-user.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { User } from '../../../domain/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UserController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    @ApiQuery({ name: 'username', required: false, description: 'Filter by username (partial match)' })
    @ApiResponse({ status: 200, description: 'List of users.', type: [UserResponseDto] })
    async findAll(@Query('username') username?: string): Promise<UserResponseDto[]> {
        const query = new ListUsersQuery(username);
        const users = await this.queryBus.execute(query);
        return users.map((user: User) => new UserResponseDto(user));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User found.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async findOne(@Param('id') id: string) {
        const query = new GetUserQuery(id);
        const result = await this.queryBus.execute(query);
        if (!result.success) {
            throw new HttpException(result.message, HttpStatus.NOT_FOUND);
        }
        // Mask password for single user retrieval too
        if (result.user) {
            const userDto = new UserResponseDto(result.user);
            return { ...result, user: userDto };
        }
        return result;
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'User updated successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        const command = new UpdateUserCommand(
            id,
            dto.profile,
            dto.status,
            dto.documentType,
            dto.documentNumber,
            dto.firstName,
            dto.lastName,
            dto.birthday ? new Date(dto.birthday) : undefined,
        );

        const result = await this.commandBus.execute(command);
        if (!result.success) {
            throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
        }
        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete (deactivate) user' })
    @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async delete(@Param('id') id: string) {
        const command = new DeleteUserCommand(id);
        const result = await this.commandBus.execute(command);
        if (!result.success) {
            throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
        }
        return result;
    }
}
