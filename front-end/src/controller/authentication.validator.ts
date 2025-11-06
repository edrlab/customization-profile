import type { Context } from "hono";
import * as secrets from "../secrets.json" with { type: "json" };
import { getSignedCookie } from 'hono/cookie';
import type { IAuthentication } from "../model/authentication.js";

export const authenticationValidatorFunction: (value: Record<string, string>, c: Context<any, string, {}>) => Promise<{ auth: true; cookie: IAuthentication } | { auth: false; cookie: IAuthentication | undefined }> = async (value, c) => {

    console.log("[VALIDATOR]: cookie value=", value);

    const authCookieString = await getSignedCookie(c, secrets.default.key, "authentication");
    const authCookie = typeof authCookieString === "string" ? JSON.parse(authCookieString) as IAuthentication : undefined;
    console.log("[VALIDATOR]: signed cookie value=", authCookie);

    if (authCookie && authCookie.id && authCookie.timestamp) {
        const currentTimestamp = Date.now();
        if (authCookie.timestamp > currentTimestamp - (1000 * 60 * 60)) {
            console.log("[validator]: cookie authentified");
            return { auth: true, cookie: authCookie };
        }
    }
    console.log("[validator]: cookie not authenticated");
    return { auth: false, cookie: authCookie };

}