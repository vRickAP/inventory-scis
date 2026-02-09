import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessTtl'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshTtl'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('jwt.accessTtl'),
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(): Promise<void> {
    // In a production system, you would implement token blacklisting here
    // For now, this is a placeholder
    return;
  }
}
