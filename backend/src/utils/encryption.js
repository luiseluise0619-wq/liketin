const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;
const ALGORITHM = 'aes-256-gcm';

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
};

const decrypt = (encryptedData, key, iv, authTag) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { hashPassword, comparePassword, encrypt, decrypt };
