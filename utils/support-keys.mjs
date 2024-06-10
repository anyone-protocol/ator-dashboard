import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util'

function naclDecodeHex(msgHex) {
  const msgBase64 = Buffer.from(msgHex, 'hex').toString('base64')

  return naclUtil.decodeBase64(msgBase64)
}

function getEncryptionPublicKey(privateKeyHex) {
  const privateKeyUint8Array = naclDecodeHex(privateKeyHex)
  const encryptionPublicKey = nacl
    .box
    .keyPair
    .fromSecretKey(privateKeyUint8Array)
    .publicKey

  return {
    publicKeyHex: Buffer.from(encryptionPublicKey).toString('hex'),
    publicKeyBase64: naclUtil.encodeBase64(encryptionPublicKey)
  }
}

const randomBytes = nacl.randomBytes(32);

const privateKey = Buffer.from(randomBytes).toString('hex');
const {publicKeyHex, publicKeyBase64} = getEncryptionPublicKey(privateKey)

console.log(`${privateKey} - ${publicKeyBase64}`);
console.log(`${publicKeyHex}`);

