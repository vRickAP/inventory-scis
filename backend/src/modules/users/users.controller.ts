import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    const { passwordHash, ...result } = user;
    return result;
  }
}
