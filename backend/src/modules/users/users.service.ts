import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@core/entities/user.entity';
import { ResourceNotFoundException } from '@common/exceptions';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new ResourceNotFoundException('User', id);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async create(userData: {
    email: string;
    fullName: string;
    password: string;
    isActive?: boolean;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      email: userData.email,
      fullName: userData.fullName,
      passwordHash,
      isActive: userData.isActive ?? true,
    });

    return this.userRepository.save(user);
  }
}
