import NLCAEncryption from './NLCAEncryption.js';
import NLCADecryption from './NLCADecryption.js';

const FileEncryption = {
  /**
   * Encrypt a file using NLCA
   * @param {File} file - File object to encrypt
   * @param {string} key - Encryption key
   * @returns {Promise<Blob>} - Encrypted file as Blob
   */
  async encryptFile(file, key) {
    const encryptor = new NLCAEncryption(key);
    return await encryptor.encryptFile(file);
  },

  /**
   * Decrypt a file using NLCA
   * @param {Blob} encryptedBlob - Encrypted file as Blob
   * @param {string} key - Decryption key
   * @param {string} originalType - Original file MIME type
   * @returns {Promise<Blob>} - Decrypted file as Blob
   */
  async decryptFile(encryptedBlob, key, originalType = 'application/octet-stream') {
    const decryptor = new NLCADecryption(key);
    return await decryptor.decryptFile(encryptedBlob, originalType);
  }
};

export default FileEncryption;