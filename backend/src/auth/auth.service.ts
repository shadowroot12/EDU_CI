import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findOneByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Assign a default role
    const userToCreate: CreateUserDto = {
      ...createUserDto,
      role: UserRole.ENSEIGNANT, // Default role for new registrations
    };

    const user = await this.usersService.create(userToCreate);
    // Exclude password hash from the result
    const { password_hash, ...result } = user;
    return result;
  }
}
