import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { MovementQueryDto } from './dto/movement-query.dto';
import { CreateMovementItemDto } from './dto/create-movement-item.dto';

@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAll(@Query() query: MovementQueryDto) {
    return this.movementsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.movementsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMovementDto: CreateMovementDto, @Request() req: any) {
    return this.movementsService.create(createMovementDto, req.user.userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMovementDto: UpdateMovementDto) {
    return this.movementsService.update(id, updateMovementDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.movementsService.delete(id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  async addItem(@Param('id') id: string, @Body() itemDto: CreateMovementItemDto) {
    return this.movementsService.addItem(id, itemDto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(@Param('itemId') itemId: string) {
    await this.movementsService.removeItem(itemId);
  }

  @Post(':id/post')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit: 10 requests per minute
  async post(@Param('id') id: string) {
    return this.movementsService.post(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.movementsService.cancel(id);
  }
}
