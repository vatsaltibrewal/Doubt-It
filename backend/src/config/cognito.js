import * as client from "openid-client";
import { createPublicKey } from 'crypto';

let _config;
let _jwtSigningKey;
let _ready = false;

export const getCognitoJWTPublicKey = async (tokenSigningKeyUrl) => {
    const res = await fetch(tokenSigningKeyUrl);
    const data = await res.json();
    const jwtSigningKey = createPublicKey({ format: 'jwk', key: data.keys[1] }).export({ format: 'pem', type: 'spki' })
    return jwtSigningKey
}

export async function initializeServer() {
  if (_ready) return { config: _config, jwtSigningKey: _jwtSigningKey };
  // Initialize OpenID Client
  let server = new URL(`https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`)
  let clientId = process.env.COGNITO_CLIENT_ID;
  let clientSecret = process.env.COGNITO_CLIENT_SECRET;
  const config = await client.discovery(
    server,
    clientId,
    clientSecret,
  )
  // Fetch PEM Key to verify ACCESS Token
  const jwtSigningKey = await getCognitoJWTPublicKey(server.href + "/.well-known/jwks.json")
  _ready = true;
  _config = config;
  _jwtSigningKey = jwtSigningKey;
  return {
    config : _config,
    jwtSigningKey: _jwtSigningKey
  };
};

export function getConfig() {
  if (!_ready) throw new Error('Cognito not initialized.');
  return _config;
}

export function getJwtSigningKey() {
  if (!_ready) throw new Error('Cognito not initialized.');
  return _jwtSigningKey;
}