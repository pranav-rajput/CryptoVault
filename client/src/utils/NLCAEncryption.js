import { NLCACore, NUM_ROUNDS } from './NLCACore.js';

class NLCAEncryption extends NLCACore {
  constructor(key) {
    super(key);
  }

  encryptBlock(block) {
    const dataView = new DataView(block.buffer);
    let P1 = dataView.getUint32(0, false);
    let P2 = dataView.getUint32(4, false);
    let P3 = dataView.getUint32(8, false);
    let P4 = dataView.getUint32(12, false);

    for (let i = 0; i < NUM_ROUNDS; i++) {
      const roundKeyInt = Number(BigInt.asUintN(32, this.roundKeys[i]));
      
      let Ro11 = ~(P1 ^ roundKeyInt) >>> 0;
      let Ro14 = ~(P4 ^ roundKeyInt) >>> 0;

      const EFL1 = this.fFunction(Ro11, this.roundKeys[i]);
      const EFR1 = this.fFunction(Ro14, this.roundKeys[i]);

      let Ro12 = P3 ^ EFL1;
      let Ro13 = P2 ^ EFR1;

      // Swap sub-blocks
      [Ro11, Ro13] = [Ro13, Ro11];
      [Ro12, Ro14] = [Ro14, Ro12];

      P1 = Ro11;
      P2 = Ro12;
      P3 = Ro13;
      P4 = Ro14;
    }

    const result = new Uint8Array(16);
    const resultView = new DataView(result.buffer);
    resultView.setUint32(0, P1, false);
    resultView.setUint32(4, P2, false);
    resultView.setUint32(8, P3, false);
    resultView.setUint32(12, P4, false);
    
    return result;
  }

  encrypt(data) {
    let dataBytes;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBytes = encoder.encode(data);
    } else {
      dataBytes = data;
    }

    const numBlocks = Math.ceil(dataBytes.length / 16);
    const ciphertext = new Uint8Array(numBlocks * 16);

    for (let blockStart = 0; blockStart < dataBytes.length; blockStart += 16) {
      const paddedBlock = new Uint8Array(16);
      const bytesToCopy = Math.min(16, dataBytes.length - blockStart);
      paddedBlock.set(dataBytes.slice(blockStart, blockStart + bytesToCopy));
      
      const encryptedBlock = this.encryptBlock(paddedBlock);
      ciphertext.set(encryptedBlock, blockStart);
    }

    return ciphertext;
  }

  async encryptFile(file) {
    // Read file as ArrayBuffer
    const fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    
    // Encrypt the file data
    const encryptedData = this.encrypt(fileData);
    
    // Convert to hex string to match Java implementation
    const hexData = NLCACore.bytesToHex(encryptedData);
    
    // Create a new Blob with encrypted data in hex format
    return new Blob([hexData], { type: 'text/plain' });
  }
}

export default NLCAEncryption;