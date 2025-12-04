import jwt from "jsonwebtoken";
import type { JsonArray } from "../manifest.js";

// https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#set-up-installation-access-tokens
// https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
// https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#get-an-organization-installation-for-the-authenticated-app
const githubAppAuthentication = async (githubAppId: string, clientId: string, privateKey: string) => {
    console.log("Get Access Token From the Github App");

    console.log("Generating JWT...");
    const now = Math.floor(Date.now() / 1000);
    const payload = { iat: now - 60, exp: now + 600, iss: githubAppId }; // 10 mins eol
    const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
    console.log("JWT generated:", token);

    console.log("Fetching installations...");

    let installationId: string = "";
    try {
        const installationsRequest = await fetch("https://api.github.com/app/installations", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!installationsRequest.ok) {
            throw new Error(`status:${installationsRequest.status} error:${installationsRequest.statusText}`);
        }

        const installationArrayData = await installationsRequest.json() as JsonArray;
        if (!Array.isArray(installationArrayData)) {
            throw new Error(`not a json array ${typeof installationArrayData}`);
        }
        const installationWithClientId = installationArrayData.find((jsonData) => (jsonData as any).client_id === clientId);
        if (!installationWithClientId) {
            throw new Error(`installation json not found with clientid: ${clientId}`);
        }
        installationId = (installationWithClientId as any).id as string;

    } catch (e) {
        throw new Error(`github app authentication error, cannot fetch app installation: ${String(e)}`);
    }

    console.log("Using installation ID:", installationId);

    console.log("Requesting installation access token...");
    let accessToken: string = "";
    let expiresAt: string = "";

    try {
        const tokenRequest = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!tokenRequest.ok) {
            throw new Error(`status:${tokenRequest.status} error:${tokenRequest.statusText}`);
        }
        const tokenData = await tokenRequest.json() as JSON;
        if (typeof tokenData === "object" && typeof (tokenData as any).token === "string" && typeof (tokenData as any).expires_at === "string") {
            accessToken = (tokenData as any).token;
            expiresAt = (tokenData as any).expires_at;
        } else {
            throw new Error(`not valid token data: ${JSON.stringify(tokenData)}`);
        }
    } catch (e) {
        throw new Error(`github app authentication error, cannot fetch access-token: ${String(e)}`);
    }

    console.log("Access token:", accessToken);
    console.log("Expires at:", expiresAt);

    return {
        accessToken,
        expiresAt,
    }

}


export const githubAuthentication = async () => {

    const privateKey = process.env.__GITHUB_APP_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("No Private Key!");
    }

    const { accessToken, expiresAt } = await githubAppAuthentication("2352918", "Iv23lihrgHNIgzNbjRso", privateKey);
    if (!accessToken) {
        throw new Error("No Access-Token generated");
    }
    return { accessToken, expiresAt };
}