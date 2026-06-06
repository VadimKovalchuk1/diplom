// BlockchainService изолирует работу с Ethereum-compatible RPC от остального backend.
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  // JsonRpcProvider подключается к private Ethereum/Besu/geth node.
  readonly provider = new ethers.JsonRpcProvider(process.env.RPC_URL ?? 'http://localhost:8545');

  // Hash документа через keccak256 — формат, совместимый с Solidity bytes32.
  hashDocument(buffer: Buffer): string { return ethers.keccak256(buffer); }

  // Получение транзакции по hash нужно для UI истории и аудита.
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> { return this.provider.getTransaction(txHash); }

  /// Проверяет документ через smart contract, если адрес registry задан.
  async verifyDocument(documentId: string, documentHash: string): Promise<{ valid: boolean; source: 'contract' | 'demo' }> {
    // Demo fallback нужен, чтобы API можно было показать без поднятой blockchain-ноды.
    if (!process.env.DOCUMENT_REGISTRY_ADDRESS) return { valid: documentId.length > 0 && documentHash.length === 66, source: 'demo' };

    // Минимальный ABI содержит только функцию, которая нужна этому сервису.
    const abi = ['function verifyDocument(bytes32,bytes32) view returns (bool, tuple(bytes32 documentHash, bytes32 metadataHash, string cid, address notary, uint64 registeredAt, uint64 updatedAt, uint8 status))'];
    const contract = new ethers.Contract(process.env.DOCUMENT_REGISTRY_ADDRESS, abi, this.provider);
    const [valid] = await contract.verifyDocument(documentId, documentHash) as [boolean, unknown];
    return { valid, source: 'contract' };
  }
}
