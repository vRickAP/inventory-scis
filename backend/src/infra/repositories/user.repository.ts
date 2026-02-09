import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.repository.create(user);
    return this.repository.save(newUser);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    await this.repository.update(id, user);
    return this.findById(id);
  }
}
