// Circom circuit для доказательства владения документом без раскрытия документа.
// Пользователь знает documentHash и ownerSecret. Circuit считает Poseidon(documentHash, ownerSecret)
// и проверяет, что результат равен публичному expectedCommitment.
pragma circom 2.1.6;

// Poseidon — hash-функция, эффективная внутри zk-SNARK circuits.
include "node_modules/circomlib/circuits/poseidon.circom";

/// Proves knowledge of documentHash and ownerSecret whose Poseidon commitment is public.
template DocumentOwnership() {
    // private input не раскрывается проверяющему и не попадает в publicSignals.
    signal private input documentHash;
    signal private input ownerSecret;

    // expectedCommitment публичен: проверяющий знает commitment, но не знает secret.
    signal input expectedCommitment;
    signal output commitment;

    // Хэшируем два приватных значения внутри circuit.
    component hasher = Poseidon(2);
    hasher.inputs[0] <== documentHash;
    hasher.inputs[1] <== ownerSecret;
    commitment <== hasher.out;

    // Главное ограничение circuit: calculated commitment обязан совпасть с публичным.
    expectedCommitment === commitment;
}

// public [expectedCommitment] означает, что commitment виден verifier'у.
component main { public [expectedCommitment] } = DocumentOwnership();
