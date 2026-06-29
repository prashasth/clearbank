const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../../.env');

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1);
    result[key] = value;
  }
  return result;
}

function writeKey(key, value) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  }
  // Ensure file ends with newline before we process
  const lines = content.split('\n');
  let found = false;

  const newLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return line;
    const lineKey = trimmed.slice(0, eqIdx).trim();
    if (lineKey === key) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    // Remove trailing empty line before appending so we don't double-blank
    while (newLines.length > 0 && newLines[newLines.length - 1].trim() === '') {
      newLines.pop();
    }
    newLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_PATH, newLines.join('\n'), 'utf8');
}

function writeBatch(updates) {
  for (const { key, value } of updates) {
    writeKey(key, value);
  }
}

function sanitizedRead() {
  const env = readEnv();
  const safe = { ...env };
  // Never expose management key value to frontend
  if (safe.DESCOPE_MANAGEMENT_KEY) {
    safe.DESCOPE_MANAGEMENT_KEY = safe.DESCOPE_MANAGEMENT_KEY ? '***set***' : '';
  }
  return safe;
}

module.exports = { readEnv, writeKey, writeBatch, sanitizedRead };
