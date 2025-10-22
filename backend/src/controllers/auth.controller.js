import * as client from 'openid-client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getConfig, getJwtSigningKey } from '../config/cognito.js';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const getCurrentUrl = (req) => {
    const currentUrl = process.env.COGNITO_CALLBACK_URL + req['_parsedUrl'].search;
    return new URL(currentUrl)
}

const verifyJWT = (jwtToken, jwtSigningKey) => {
    return jwt.verify(jwtToken, jwtSigningKey, (err, decoded) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            return false;
        } else {
            return true;
        }
    });
}

export const accessVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

export const idVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID,
});

export async function login(req, res) {
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();
    let parameters = {
        redirect_uri: process.env.COGNITO_CALLBACK_URL,
        code_challenge,
        code_challenge_method: 'S256',
        state
    }
    const config = getConfig();
    const cognitoLoginURL = client.buildAuthorizationUrl(config, parameters).href;
    res.cookie('state', state, { httpOnly: true, signed: true, sameSite: 'lax', secure: true, domain: '.doubtit.vatsal.tech', path: '/' });
    res.cookie('code_verifier', code_verifier, { httpOnly: true, signed: true, sameSite: 'lax', secure: true, domain: '.doubtit.vatsal.tech', path: '/' });
    res.status(200).send(JSON.stringify({ cognitoLoginURL }));
}

export async function token(req, res) {
    try {
        const { state, code_verifier } = req.signedCookies;
        const config = getConfig();
        let tokens = await client.authorizationCodeGrant(
            config,
            getCurrentUrl(req),
            {
                pkceCodeVerifier: code_verifier,
                expectedState: state,
            },
        )
        res.cookie('ACCESS_TOKEN', tokens.access_token, { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.cookie('REFRESH_TOKEN', tokens.refresh_token, { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.cookie('ID_TOKEN', tokens.id_token, { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.clearCookie("state", { httpOnly: true, signed: true, sameSite: 'lax', secure: true, domain: '.doubtit.vatsal.tech', path: '/' });
        res.clearCookie("code_verifier", { httpOnly: true, signed: true, sameSite: 'lax', secure: true, domain: '.doubtit.vatsal.tech', path: '/' });
        res.status(200).send(tokens)
    }
    catch (err) {
        console.error(err);
        res.status(500).send(err)
    }
}

export async function verifyLogin(req, res) {
    const { ACCESS_TOKEN: accessToken } = req.signedCookies;
    const jwtSigningKey = getJwtSigningKey();
    if (verifyJWT(accessToken, jwtSigningKey)) {
        res.status(200).send("Authenticated");
    } else {
        res.status(401).send("Unauthenticated");
    }
}

export async function me(req, res) {
    const accessToken = req.signedCookies?.ACCESS_TOKEN;
    const idToken     = req.signedCookies?.ID_TOKEN;

    if (!accessToken || !idToken) {
        return res.status(401).send('Unauthenticated');
    }

    try {
        const access = await accessVerifier.verify(accessToken);
        const id = await idVerifier.verify(idToken);

        return res.status(200).json({ id: id.sub, email: id.email, exp: access.exp });
    } catch (e) {
        return res.status(401).send('Unauthenticated');
    }
}

export async function logout(req, res) {
    try {
        const logoutUrl = new URL(`${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=${process.env.COGNITO_LOGOUT_URL}`);
        res.clearCookie('ACCESS_TOKEN', { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.clearCookie('REFRESH_TOKEN', { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.clearCookie('ID_TOKEN', { httpOnly: true, signed: true, secure: true, sameSite: 'lax', domain: '.doubtit.vatsal.tech', path: '/' });
        res.status(200).send(JSON.stringify({ cognitoLogoutURL: logoutUrl }));
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export async function realtimeToken(req, res) {
    const {ID_TOKEN: idToken, ACCESS_TOKEN: accessToken} = req.signedCookies;
    try {
        const jwtSigningKey = getJwtSigningKey();
        // Verify Cognito access token server-side
        if (!verifyJWT(accessToken, jwtSigningKey)) res.status(401).send("Unauthenticated");

        // Create a short-lived ticket (60s) that $connect will verify
        // const jti = crypto.randomUUID();
        // const ticket = jwt.sign(
        //     { sub: payload.sub, typ: 'ws', jti },
        //     process.env.WS_TICKET_SECRET,
        //     { issuer: 'doubtit', audience: 'ws', expiresIn: '60s' }
        // )

        const base = process.env.WS_URL;
        const wsUrl = `${base}?token=${accessToken}`;
        res.status(200).send(JSON.stringify({ websocketURL: wsUrl }));
    } catch (e) {
        console.error('ticket error', e);
        res.status(401).json({ error: 'unauthenticated' });
    }
}