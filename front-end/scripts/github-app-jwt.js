import fs from "fs";
import jwt from "jsonwebtoken";

const appId = process.argv[2];
const privateKey = fs.readFileSync(process.argv[3], "utf8");

console.log("Generating JWT...");
const now = Math.floor(Date.now() / 1000);
const payload = { iat: now - 60, exp: now + 600, iss: appId };
const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
console.log("JWT generated:", token);

console.log("Fetching installations...");
const installationsRes = await fetch("https://api.github.com/app/installations", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  },
});
const installations = await installationsRes.json();
console.log("Installations:", installations);

if (!Array.isArray(installations) || installations.length === 0) {
  console.error("No installations found");
  process.exit(1);
}

const installationId = installations[0].id;
console.log("Using installation ID:", installationId);

console.log("Requesting installation access token...");
const tokenRes = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  },
});
const tokenData = await tokenRes.json();
console.log("Token response:", tokenData);

const accessToken = tokenData.token;
const expiresAt = tokenData.expires_at;

console.log("Access token:", accessToken);
console.log("Expires at:", expiresAt);
