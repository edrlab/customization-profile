import * as secrets from "../secrets.json" with { type: "json" };
import type { IAuthentication } from "../model/authentication.js";
import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const authenticationMiddleware =  createMiddleware<{
  Variables: {
    auth: IAuthentication
  }
}>(async (c, next) => {

    const authCookieString = await getSignedCookie(c, secrets.default.key, 'authentication');
    const authCookie = typeof authCookieString === "string" ? JSON.parse(authCookieString) as IAuthentication : undefined;
    console.log("[middleware]: signed cookie value=", authCookie);

    if (authCookie && authCookie.id && authCookie.timestamp) {
        const currentTimestamp = Date.now();
        if (authCookie.timestamp > currentTimestamp - (1000 * 60 * 60)) {
            console.log("[middleware]: cookie authentified");
            c.set('auth', authCookie);
            if (c.req.path === "/login") {
                return c.redirect("/profile");
            } else {
                await next();
                return c.res;
            }
        }
    }

    console.log("[middleware]: cookie not authentified");
    if (!c.req.path.startsWith("/login")) {
        return c.redirect("/login");
    }
    await next();
    return c.res;
});

// export const authenticationValidator = validator('cookie', async (_, c) => {
// // midleware start

//     const authCookieString = await getSignedCookie(c, secrets.default.key, 'authentication');
//     const authCookie = typeof authCookieString === "string" ? JSON.parse(authCookieString) as IAuthentication : undefined;
//     console.log("[VALIDATOR]: signed cookie value=", authCookie);

//     if (authCookie && authCookie.id && authCookie.timestamp) {
//         const currentTimestamp = Date.now();
//         if (authCookie.timestamp > currentTimestamp - (1000 * 60 * 60)) {
//             console.log("[validator]: cookie authentified");
//             return authCookie;
//         }
//     } else {
//         return c.redirect("/profile");
//     }
//     console.log("[validator]: cookie not authenticated");
//     return undefined;
// });