import { expect } from 'chai';
import { ethers } from 'hardhat';

const NOTARY = ethers.keccak256(ethers.toUtf8Bytes('NOTARY'));

describe('DocumentRegistry', () => {
  it('registers and verifies a document commitment', async () => {
    const [admin, notary] = await ethers.getSigners();
    const Access = await ethers.getContractFactory('NotaryAccessControl');
    const access = await Access.deploy(admin.address);
    const Audit = await ethers.getContractFactory('AuditContract');
    const audit = await Audit.deploy(await access.getAddress());
    const Registry = await ethers.getContractFactory('DocumentRegistry');
    const registry = await Registry.deploy(await access.getAddress(), await audit.getAddress());
    await audit.setAuthorizedWriter(await registry.getAddress(), true);

    await access.registerParticipant(notary.address, NOTARY, '77', 'ipfs://notary');
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes('encrypted-document'));
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes('metadata'));
    const cid = 'bafybeidemo';
    const nonce = await registry.nonces(notary.address);
    const digest = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'address', 'uint256', 'bytes32', 'bytes32', 'string'],
      [await registry.getAddress(), 31337, notary.address, nonce, documentHash, metadataHash, cid]
    );
    const signature = await notary.signMessage(ethers.getBytes(digest));

    const tx = await registry.connect(notary).registerDocument(documentHash, metadataHash, cid, signature);
    const receipt = await tx.wait();
    const event = receipt?.logs.map((log) => registry.interface.parseLog(log)).find((log) => log?.name === 'DocumentRegistered');
    const documentId = event?.args.documentId;
    const [valid] = await registry.verifyDocument(documentId, documentHash);
    expect(valid).to.equal(true);
  });
});
