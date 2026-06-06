// Demo prover helper. В production здесь будет snarkjs.groth16.fullProve.
import { createHash } from 'crypto';

export interface DemoProof { proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] }; publicSignals: string[]; }

// Commitment демонстрирует идею: связываем hash документа и секрет владельца.
export function createDemoCommitment(documentHash: string, ownerSecret: string): string {
  return createHash('sha256').update(`${documentHash}:${ownerSecret}`).digest('hex');
}

// Возвращаем proof-like структуру, чтобы frontend/backend уже имели правильный контракт данных.
export async function generateDemoProof(documentHash: string, ownerSecret: string): Promise<DemoProof> {
  const commitment = createDemoCommitment(documentHash, ownerSecret);
  return { proof: { pi_a: ['1', '2', '1'], pi_b: [['3', '4'], ['5', '6'], ['1', '0']], pi_c: ['7', '8', '1'] }, publicSignals: [`0x${commitment}`] };
}
