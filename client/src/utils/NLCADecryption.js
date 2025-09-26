import { NLCACore, NUM_ROUNDS } from './NLCACore.js';

class NLCADecryption extends NLCACore {
  constructor(key) {
    super(key);
  }

  decryptBlock(block) {
    const dataView = new DataView(block.buffer);
    let C1 = dataView.getUint32(0, false);
    let C2 = dataView.getUint32(4, false);
    let C3 = dataView.getUint32(8, false);
    let C4 = dataView.getUint32(12, false);

    for (let i = NUM_ROUNDS - 1; i >= 0; i--) {
      const roundKeyInt = Number(BigInt.asUintN(32, this.roundKeys[i]));
      
      // These are the values after the last swap in encryption round i
      let Ro11 = C1;
      let Ro12 = C2;
      let Ro13 = C3;
      let Ro14 = C4;

      // Undo the swap from encryption
      [Ro11, Ro13] = [Ro13, Ro11]; 
      [Ro12, Ro14] = [Ro14, Ro12];

      // Calculate EFL1 and EFR1 using the same formula as encryption
      const EFL1 = this.fFunction(Ro11, this.roundKeys[i]);
      const EFR1 = this.fFunction(Ro14, this.roundKeys[i]);

      // Recover original P values
      const P1 = ~Ro11 ^ roundKeyInt >>> 0;
      const P2 = Ro13 ^ EFR1;
      const P3 = Ro12 ^ EFL1;
      const P4 = ~Ro14 ^ roundKeyInt >>> 0;

      // Set for next round
      C1 = P1;
      C2 = P2;
      C3 = P3;
      C4 = P4;
    }

    const result = new Uint8Array(16);
    const resultView = new DataView(result.buffer);
    resultView.setUint32(0, C1, false);
    resultView.setUint32(4, C2, false);
    resultView.setUint32(8, C3, false);
    resultView.setUint32(12, C4, false);
    
    return result;
  }

  decrypt(encryptedData) {
    if (encryptedData.length % 16 !== 0) {
      throw new Error('Encrypted data length must be a multiple of 16 bytes');
    }

    const numBlocks = encryptedData.length / 16;
    const plaintext = new Uint8Array(numBlocks * 16);

    for (let blockStart = 0; blockStart < encryptedData.length; blockStart += 16) {
      const encryptedBlock = encryptedData.slice(blockStart, blockStart + 16);
      const decryptedBlock = this.decryptBlock(encryptedBlock);
      plaintext.set(decryptedBlock, blockStart);
    }

    // Remove padding (trailing zeros)
    let actualLength = plaintext.length;
    while (actualLength > 0 && plaintext[actualLength - 1] === 0) {
      actualLength--;
    }

    return plaintext.slice(0, actualLength);
  }

  decryptToString(encryptedData) {
    const decryptedData = this.decrypt(encryptedData);
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  async decryptFile(encryptedBlob, originalType = 'application/octet-stream') {
    // Read encrypted blob as text (hex string)
    const hexString = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(encryptedBlob);
    });

    // Convert hex to bytes
    const encryptedData = NLCACore.hexToBytes(hexString);
    
    // Decrypt the file data
    const decryptedData = this.decrypt(encryptedData);
    
    // Create a new Blob with decrypted data
    return new Blob([decryptedData], { type: originalType });
  }
}

export default NLCADecryption;