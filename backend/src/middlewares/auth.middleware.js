import { getJwtSigningKey } from "../config/cognito.js";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.signedCookies?.ACCESS_TOKEN;
    if (!token) return res.status(401).send("Unauthenticated");
    const key = getJwtSigningKey();
    // verify throws on invalid; returns decoded on success
    const decoded = jwt.verify(token, key); // algorithms: ['RS256'] if you want to be strict
    req.user = decoded; // <-- CRITICAL: make the user available
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).send("Unauthenticated");
  }
};

export const adminMiddleware = (req, res, next) => {
  const groups = req.user?.["cognito:groups"] || [];
  if (Array.isArray(groups) && groups.includes("Admin")) return next();
  return res.status(403).send("Admin Route Forbidden");
};
