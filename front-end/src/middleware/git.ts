import { createMiddleware } from "hono/factory";
import type { SimpleGit } from "simple-git";
import { gitInit } from "../model/git/init.js";
import type { IAuthentication, ISession } from "../model/cookie.js";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import * as secrets from "../secrets.json" with { type: "json" };

export const gitMiddleware = createMiddleware<{
  Variables: {
    auth: IAuthentication,
    git: SimpleGit,
    gitDirectory: string,
  }
}>(async (c, next) => {

    if (!c.var.auth) {
        throw new Error("No Authentication Data !");
    }

    const sessionCookie = await getSignedCookie(c, secrets.default.key, "session");
    if (!sessionCookie) {
        throw new Error("No Session Id");
    }

    const { session, expiresAt } = JSON.parse(sessionCookie) as ISession;
  const { git, expiresAt: expiresAtReceived, gitbaseDir } = await gitInit(c.var.auth, session, expiresAt);
    if (expiresAt !== expiresAtReceived) {
        const cookie: ISession = {session: session, expiresAt: expiresAtReceived};
        await setSignedCookie(c, 'session', JSON.stringify(cookie), secrets.default.key);
        console.log(`Set session signed Cookie=${JSON.stringify(cookie)}`);
    }

    c.set('git', git);
    c.set('gitDirectory', gitbaseDir);

    await next();
});