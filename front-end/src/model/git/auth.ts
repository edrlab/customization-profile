import jwt from "jsonwebtoken";

// https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#set-up-installation-access-tokens
// https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
// https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#get-an-organization-installation-for-the-authenticated-app
export const githubAppAuthentication = async (githubAppId: string, clientId: string, privateKey: string) => {
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
            throw `status:${installationsRequest.status} error:${installationsRequest.statusText}`;
        }

        const installationArrayData = await installationsRequest.json();
        if (!Array.isArray(installationArrayData)) {
            throw `not a json array ${typeof installationArrayData}`;
        }
        const installationWithClientId = installationArrayData.find(({ client_id }) => client_id === clientId);
        if (!installationWithClientId) {
            throw `installation json not found with clientid: ${clientId}`;
        }
        installationId = installationWithClientId.id as string;

    } catch (e) {
        throw new Error(`github app authentication error, cannot fetch app installation: ${e}`);
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
            throw `status:${tokenRequest.status} error:${tokenRequest.statusText}`;
        }
        const tokenData = await tokenRequest.json();
        if (typeof tokenData.token === "string" && typeof tokenData.expires_at === "string") {
            accessToken = tokenData.token;
            expiresAt = tokenData.expires_at;
        } else {
            throw `not valid token data: ${JSON.stringify(tokenData)}`;
        }
    } catch (e) {
        throw new Error(`github app authentication error, cannot fetch access-token: ${e}`);
    }

    console.log("Access token:", accessToken);
    console.log("Expires at:", expiresAt);

    return {
        accessToken,
        expiresAt,
    }

}