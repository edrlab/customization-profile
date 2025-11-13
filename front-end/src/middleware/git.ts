import { createMiddleware } from "hono/factory";
import type { SimpleGit } from "simple-git";
import { gitInit } from "../model/git/init.js";
import type { IAuthentication } from "../model/authentication.js";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import * as secrets from "../secrets.json" with { type: "json" };

export const gitMiddleware = createMiddleware<{
  Variables: {
    auth: IAuthentication,
    git: SimpleGit,
  }
}>(async (c, next) => {

    if (!c.var.auth) {
        throw new Error("No Authentication Data !");
    }

    const sessionCookie = await getSignedCookie(c, secrets.default.key, "session");
    if (!sessionCookie) {
        throw new Error("No Session Id");
    }

    const { session, expiresAt } = JSON.parse(sessionCookie);
    const {git, expiresAt: expiresAtReceived} = await gitInit(c.var.auth, session, expiresAt);
    if (expiresAt !== expiresAtReceived) {
        const cookie = {session: session, expiresAt: expiresAtReceived};
        await setSignedCookie(c, 'session', JSON.stringify(cookie), secrets.default.key);
        console.log(`Set session signed Cookie=${JSON.stringify(cookie)}`);
    }

    c.set('git', git);

    await next();
});