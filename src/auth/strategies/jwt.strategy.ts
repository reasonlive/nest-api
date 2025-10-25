import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    } as StrategyOptionsWithoutRequest);
  }

  async validate(payload: {email: string, sub: number, iat: number, exp: number}): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'firstName', 'lastName'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}