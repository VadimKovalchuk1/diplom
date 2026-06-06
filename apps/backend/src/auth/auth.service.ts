// AuthService реализует вход через подпись кошельком.
// Пользователь доказывает владение private key, не передавая private key серверу.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { Role } from '../common/roles';

// Payload, который попадёт внутрь JWT. Backend потом читает его в guards/controllers.
export interface AuthenticatedUser { sub: string; wallet: string; roles: Role[]; chamberCode: string; }

@Injectable()
export class AuthService {
  // In-memory nonce store — демонстрационный вариант. В production nonce надо хранить
  // в Redis/PostgreSQL с TTL, чтобы переживать restart backend'а и предотвращать replay.
  private readonly nonces = new Map<string, string>();

  constructor(private readonly jwt: JwtService) {}

  /// Создаём случайный nonce, который пользователь должен подписать кошельком.
  createNonce(wallet: string): string {
    const nonce = ethers.hexlify(ethers.randomBytes(16));
    this.nonces.set(wallet.toLowerCase(), nonce);
    return nonce;
  }

  /// Проверяем подпись nonce и выдаём JWT.
  async login(wallet: string, signature: string): Promise<{ accessToken: string }> {
    const nonce = this.nonces.get(wallet.toLowerCase());
    if (!nonce) throw new UnauthorizedException('Nonce not requested');

    // ethers.verifyMessage восстанавливает адрес кошелька, который подписал сообщение.
    const recovered = ethers.verifyMessage(`FNP login nonce: ${nonce}`, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) throw new UnauthorizedException('Invalid wallet signature');

    // Для демонстрации выдаём роль NOTARY. В production роли должны подтягиваться
    // из PostgreSQL и/или сверяться с NotaryAccessControl smart contract.
    const payload: AuthenticatedUser = { sub: wallet.toLowerCase(), wallet, roles: [Role.NOTARY], chamberCode: '77' };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
