const DescopeClient = require('@descope/node-sdk');

let _client = null;

function getClient() {
  const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;
  const projectId = process.env.VITE_DESCOPE_PROJECT_ID;

  if (!projectId || !managementKey) return null;

  // Re-init if key changed
  if (!_client) {
    try {
      _client = DescopeClient({ projectId, managementKey });
    } catch (err) {
      console.error('[descopeClient] Init failed:', err.message);
      return null;
    }
  }
  return _client;
}

function resetClient() {
  _client = null;
}

module.exports = { getClient, resetClient };
