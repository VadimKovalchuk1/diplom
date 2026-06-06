// ZkController предоставляет REST API для генерации и проверки ZK proof.
import { Body, Controller, Post } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { ZkProofResponse, ZkService } from './zk.service';

class ProofDto { @IsString() documentHash!: string; @IsString() ownerSecret!: string; }
class VerifyProofDto { @IsArray() publicSignals!: string[]; }

@Controller('zk')
export class ZkController {
  constructor(private readonly zk: ZkService) {}

  // Генерация proof на основе приватного witness. В demo secret приходит в API,
  // но production лучше генерировать proof на клиенте или в доверенном HSM-сервисе.
  @Post('proof') generate(@Body() dto: ProofDto): Promise<ZkProofResponse> { return this.zk.generateProof(dto.documentHash, dto.ownerSecret); }

  // Проверка publicSignals/proof. Реальная версия дополнительно вызывает ZKVerifier.sol.
  @Post('verify') verify(@Body() dto: VerifyProofDto): Promise<{ valid: boolean }> { return this.zk.verify(dto.publicSignals); }
}
