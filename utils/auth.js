const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

function createJWT() {
  const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');

  const header = {
    alg: 'RS384',
    typ: 'JWT',
    kid: 'my-backend-key-1'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: process.env.EPIC_CLIENT_ID,
    sub: process.env.EPIC_CLIENT_ID,
    aud: process.env.EPIC_TOKEN_URL,
    jti: uuidv4(),
    iat: now,
    exp: now + 300
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${base64Header}.${base64Payload}`;

  const signature = crypto.sign('sha384', Buffer.from(signingInput), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  });

  return `${signingInput}.${signature.toString('base64url')}`;
}

async function getAccessToken() {
  const jwt = createJWT();

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: jwt
  });

  const response = await axios.post(process.env.EPIC_TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data.access_token;
}

module.exports = { getAccessToken };