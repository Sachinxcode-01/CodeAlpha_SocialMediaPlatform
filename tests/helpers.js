/**
 * Test Helper for NovaConnect
 * Launches an ephemeral test server and provides convenience HTTP request helpers.
 */

process.env.NODE_ENV = 'test';
process.env.DATABASE_FILE = ':memory:';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_automated_testing_12345';

const http = require('http');
const app = require('../backend/server');
const { resetDatabase } = require('../backend/database/db');

let server = null;
let baseUrl = '';

async function startServer() {
  if (server) return { baseUrl, server };
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve({ baseUrl, server });
    });
  });
}

async function stopServer() {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        server = null;
        resolve();
      });
    });
  }
}

/**
 * Perform a JSON HTTP request against the test server
 */
async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    body: data
  };
}

module.exports = {
  startServer,
  stopServer,
  resetDatabase,
  request
};
