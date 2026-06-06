// DocumentsService — бизнес-логика нотариальных документов.
// Controller принимает HTTP-запрос, а service решает, как считать hash, шифровать,
// сохранять off-chain и запускать blockchain-проверку.
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ethers } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { RegisterDocumentDto, VerifyDocumentDto } from './dto';

// Тип результата регистрации. status PENDING_ON_CHAIN означает, что backend подготовил
// данные, а wallet/frontend ещё должен отправить транзакцию в smart contract.
export interface RegisteredDocument { documentId: string; documentHash: string; cid: string; status: 'PENDING_ON_CHAIN' | 'ACTIVE'; txHash?: string; }

@Injectable()
export class DocumentsService {
  // In-memory хранилище только для демонстрации. Production-версия должна писать в PostgreSQL.
  private readonly documents = new Map<string, RegisteredDocument>();

  constructor(private readonly ipfs: IpfsService, private readonly blockchain: BlockchainService) {}

  /// Регистрирует документ на уровне backend: считает hash, шифрует, отправляет в IPFS.
  async register(dto: RegisterDocumentDto, notaryWallet: string): Promise<RegisteredDocument> {
    // Документ приходит в base64, потому что JSON не умеет безопасно передавать binary.
    const content = Buffer.from(dto.base64Content, 'base64');

    // keccak256 выбран, потому что это стандартный hash Ethereum ecosystem.
    const documentHash = ethers.keccak256(content);

    // MetadataHash связывает on-chain запись с metadata, не раскрывая её содержимое.
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ fileName: dto.fileName, mimeType: dto.mimeType, regionalChamberCode: dto.regionalChamberCode })));

    // IpfsService шифрует документ и возвращает CID зашифрованного payload.
    const { cid } = await this.ipfs.addEncrypted(content);

    // Demo documentId генерируется backend'ом для read model. Реальный on-chain documentId
    // возвращается событием DocumentRegistered после mined transaction.
    const documentId = ethers.keccak256(ethers.toUtf8Bytes(`${documentHash}:${notaryWallet}:${Date.now()}`));
    const record: RegisteredDocument = { documentId, documentHash, cid, status: 'PENDING_ON_CHAIN' };
    this.documents.set(documentId, record);

    // metadataHash сейчас считается для будущей blockchain-транзакции; строка ниже явно
    // показывает, что значение не забыто случайно, а будет использовано на следующем этапе.
    void metadataHash;
    return record;
  }

  /// Публичная проверка: превращаем SHA-256/hex input в формат hash и спрашиваем blockchain.
  async verify(dto: VerifyDocumentDto): Promise<{ valid: boolean; documentHash: string; source: string }> {
    const documentHash = `0x${dto.sha256}`;
    const onChain = await this.blockchain.verifyDocument(dto.documentId, documentHash);
    return { valid: onChain.valid, documentHash, source: onChain.source };
  }

  /// SHA-256 checksum полезен для интеграции с внешними системами, где принят SHA-256.
  checksum(buffer: Buffer): string { return createHash('sha256').update(buffer).digest('hex'); }

  /// Возвращает документы из демонстрационного read model.
  list(): RegisteredDocument[] { return [...this.documents.values()]; }
}
