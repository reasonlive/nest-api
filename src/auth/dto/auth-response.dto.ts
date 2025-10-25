import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };

  constructor(accessToken: string, user: User) {
    this.accessToken = accessToken;
    this.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}