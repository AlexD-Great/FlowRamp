const { ec } = require("elliptic");
const { SHA3 } = require("sha3");

// Use P256 curve (also known as secp256r1 or prime256v1)
// This matches the ECDSA_P256 algorithm on your Flow account
const ec_p256 = new ec("p256");

const sign = (privateKey, message) => {
  const key = ec_p256.keyFromPrivate(privateKey, "hex");
  const sig = key.sign(hash(message));
  
  // Flow requires signature in raw format (r + s), not DER format
  // Each component (r and s) should be exactly 32 bytes
  const r = sig.r.toArrayLike(Buffer, "be", 32);
  const s = sig.s.toArrayLike(Buffer, "be", 32);
  
  return Buffer.concat([r, s]).toString("hex");
};

const hash = (message) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(message, "hex"));
  return sha.digest();
};

const authorization = (address, privateKey, keySequenceNumber) => async (account = {}) => {
  const user = await getAccount(address);
  const key = user.keys[keySequenceNumber];

  const signable = {
    ...account,
    addr: user.address,
    keyId: key.index,
    sequenceNum: key.sequenceNumber,
  };

  const a = (message) => ({
    addr: user.address,
    keyId: key.index,
    signature: sign(privateKey, message),
  });

  return {
    ...signable,
    // TEMP HACK
    // signature: "123",
    signature: a(signable).signature
  };
};

module.exports = {
  authorization,
  sign,
  hash,
};
