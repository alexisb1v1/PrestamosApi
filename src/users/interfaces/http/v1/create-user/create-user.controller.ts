import {
  Body,
  Controller,
  Post,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.request.dto';
import { CreateUserResponseDto } from './dto/create-user.response.dto';
import { CreateUserCommand } from '../../../../application/commands/v1/create-user.command';
import { CreateUserResult } from '../../../../application/commands/v1/handlers/create-user.handler';

@ApiTags('Users')
@Controller('api/v1/users')
export class CreateUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user with person data' })
  @ApiResponse({
    status: 201,
    description: 'User and Person created successfully.',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or creation error.',
  })
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const {
      username,
      password,
      profile,
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthday,
      idCompany,
    } = dto;

    const birthdayDate = new Date(birthday);

    const command = new CreateUserCommand(
      username,
      password,
      profile,
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthdayDate,
      idCompany,
    );

    const result = await this.commandBus.execute<
      CreateUserCommand,
      CreateUserResult
    >(command);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return new CreateUserResponseDto(
      result.success,
      result.message,
      result.userId,
    );
  }
}
