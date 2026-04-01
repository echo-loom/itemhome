function isPhone11(phone) {
  return typeof phone === 'string' && /^[0-9]{11}$/.test(phone.trim());
}

function normalizePhone(phone) {
  return (phone || '').trim();
}

function isPasswordOk(pw) {
  // at least 6 chars
  return typeof pw === 'string' && pw.length >= 6;
}

function isRoomName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

function isJsonObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

module.exports = { isPhone11, normalizePhone, isPasswordOk, isRoomName, isJsonObject };

