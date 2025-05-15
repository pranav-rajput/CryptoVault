/**
 * Core NLCA (New Lightweight Cryptographic Algorithm) implementation
 * Contains shared functionality for both encryption and decryption
 */

const NUM_ROUNDS = 5;
const S_BOX = [0x3, 0xF, 0xE, 0x1, 0x0, 0x7, 0x5, 0xA, 0x4, 0xC, 0xB, 0x9, 0x2, 0x8, 0xD, 0x6];

class NLCACore {
  constructor(key) {
    if (typeof key === 'string') {
      const encoder = new TextEncoder();
      key = encoder.encode(key);
    }
    this.roundKeys = this.generateSubkeys(key);
  }

  generateSubkeys(key) {
    const subkeys = new Array(NUM_ROUNDS);
    let seed = 0n;
    
    for (const b of key) {
      seed = (seed << 8n) | BigInt(b & 0xFF);
    }
    
    for (let i = 0; i < NUM_ROUNDS; i++) {
      seed = (seed * 6364136223846793005n) + 1442695040888963407n;
      subkeys[i] = seed;
    }
    
    return subkeys;
  }

  leftShift(value, positions) {
    return ((value << positions) | (value >>> (32 - positions))) >>> 0;
  }

  substitute(value) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
      const nibble = (value >>> (i * 4)) & 0xF;
      result |= S_BOX[nibble] << (i * 4);
    }
    return result >>> 0;
  }

  fFunction(input, roundKey) {
    const leftShifted = this.leftShift(input, 4);
    const andResult = leftShifted & Number(BigInt.asUintN(32, roundKey));
    const substituted = this.substitute(andResult);
    return (substituted | Number(BigInt.asUintN(32, roundKey))) >>> 0;
  }

  static bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}

export { NLCACore, NUM_ROUNDS };