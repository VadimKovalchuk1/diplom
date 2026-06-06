import { BlockchainService } from '../src/blockchain/blockchain.service';
import { DocumentsService } from '../src/documents/documents.service';
import { IpfsService } from '../src/ipfs/ipfs.service';

describe('DocumentsService', () => {
  it('creates an encrypted off-chain record', async () => {
    const service = new DocumentsService(new IpfsService(), new BlockchainService());
    const result = await service.register({ fileName: 'a.pdf', mimeType: 'application/pdf', base64Content: Buffer.from('demo').toString('base64') }, '0x0000000000000000000000000000000000000001');
    expect(result.cid).toContain('bafy-demo-');
    expect(result.documentHash).toMatch(/^0x/);
  });
});
