// JwtStrategy объясняет Passport, как извлекать и проверять JWT из Authorization header.
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Ожидаемый формат HTTP header: Authorization: Bearer <token>.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Для диссертационного стенда есть fallback, но production обязан задавать секрет через env/KMS.
      secretOrKey: process.env.JWT_SECRET ?? 'change-me'
    });
  }

  // validate возвращает объект user, который NestJS положит в request.user.
  validate(payload: AuthenticatedUser): AuthenticatedUser { return payload; }
}
