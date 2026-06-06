// Hardhat deployment script. Запускается командой npm run deploy:local --workspace @fnp/blockchain.
import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  // 1. Сначала разворачиваем RBAC-контракт, потому что другие контракты зависят от ролей.
  const Access = await ethers.getContractFactory('NotaryAccessControl');
  const access = await Access.deploy(deployer.address);
  await access.waitForDeployment();

  // 2. Затем audit contract, который будет принимать immutable audit events.
  const Audit = await ethers.getContractFactory('AuditContract');
  const audit = await Audit.deploy(await access.getAddress());
  await audit.waitForDeployment();

  // 3. DocumentRegistry получает адреса RBAC и audit contracts.
  const Registry = await ethers.getContractFactory('DocumentRegistry');
  const registry = await Registry.deploy(await access.getAddress(), await audit.getAddress());
  await registry.waitForDeployment();

  // Разрешаем DocumentRegistry писать в AuditContract.
  await audit.setAuthorizedWriter(await registry.getAddress(), true);

  // 4. ZKVerifier разворачивается отдельно, потому что его можно заменить generated verifier'ом.
  const Zk = await ethers.getContractFactory('ZKVerifier');
  const zkVerifier = await Zk.deploy();
  await zkVerifier.waitForDeployment();

  console.table({
    deployer: deployer.address,
    access: await access.getAddress(),
    audit: await audit.getAddress(),
    registry: await registry.getAddress(),
    zkVerifier: await zkVerifier.getAddress()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
