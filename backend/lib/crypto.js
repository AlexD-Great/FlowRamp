const { ec } = require("elliptic");
const { SHA3 } = require("sha3");

const ec_secp256k1 = new ec("secp256k1");

const sign = (privateKey, message) => {
  const key = ec_secp256k1.keyFromPrivate(privateKey, "hex");
  const sig = key.sign(hash(message));
  return Buffer.from(sig.toDER()).toString("hex");
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
};
