// IpfsService отвечает за конфиденциальное off-chain хранение.
// Важно: IPFS сам по себе публичный content-addressed storage, поэтому документ
// обязательно шифруется до отправки в IPFS.
import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class IpfsService {
  // Демонстрационный in-memory store заменяет реальный ipfs-http-client в учебном стенде.
  private readonly memoryStore = new Map<string, Buffer>();

  /// Шифрует документ алгоритмом AES-256-GCM.
  /// GCM даёт не только конфиденциальность, но и контроль целостности через authTag.
  encrypt(buffer: Buffer, key = randomBytes(32)): { encrypted: Buffer; key: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { encrypted, key, iv, authTag: cipher.getAuthTag() };
  }

  /// Расшифровывает документ. Если authTag не совпал, Node.js выбросит ошибку.
  decrypt(encrypted: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /// Шифрует документ и «сохраняет» его в demo IPFS store.
  async addEncrypted(buffer: Buffer): Promise<{ cid: string; encrypted: Buffer; encryptionKeyRef: string }> {
    const { encrypted, key } = this.encrypt(buffer);

    // CID в реальном IPFS генерируется протоколом. Здесь имитируем CID через hash ciphertext.
    const cid = `bafy-demo-${createHash('sha256').update(encrypted).digest('hex').slice(0, 32)}`;
    this.memoryStore.set(cid, encrypted);

    // encryptionKeyRef — не сам ключ, а ссылка/отпечаток. Production-ключ хранится в KMS/HSM.
    return { cid, encrypted, encryptionKeyRef: createHash('sha256').update(key).digest('hex') };
  }
}
