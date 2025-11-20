
import { Hono } from 'hono'
import { Login } from '../view/login.js';
import { validator } from 'hono/validator'
import type { IAuthentication } from '../model/cookie.js';
// import { authenticationValidatorFunction } from './authentication.js';
import { setSignedCookie } from 'hono/cookie';
import * as secrets from "../secrets.json" with { type: "json" };
import { nanoid } from 'nanoid';
import { authenticationMiddleware } from '../middleware/authentication.js';

const login = new Hono()
    .use(authenticationMiddleware);

login.get('/',
    validator('cookie', async (cookies, c) => {
        if (!cookies["session"]) {
            const cookie = {session: nanoid(), expiresAt: ""};
            console.log("set session cookie=", cookie);
            await setSignedCookie(c, "session", JSON.stringify(cookie), secrets.default.key);
        }
    }),
    (c) => {

        return c.render(
            <>
                <title>LOGIN</title>
                <Login invalid={!!c.req.queries("invalid")} />
            </>
        );
    });

login.post('/validate',
    validator('form', (value, _c) => {
        // console.log("[VALIDATOR]: form value=", JSON.stringify(value, null, 4));

        const user = secrets.default.users.find(({username}) => username === value["username"]);
        const authentified = user?.password === value["password"];
        if (authentified) {
            return {
                user,
            }
        }

        return {}
    }),
    async (c) => {

        const { user } = c.req.valid('form');
        console.log("authenticated=", user);

        const cookie = c.var.auth;

        if (user) {
            // authentication
            const auth: IAuthentication = {
                id: user.id,
                username: user.username,
                timestamp: Date.now(),
                counter: cookie?.counter || 1,
                lastConnectionTime: Date.now(),
            }
            await setSignedCookie(c, 'authentication', JSON.stringify(auth), secrets.default.key);
            return c.redirect('/profile');
        } else {
            return c.redirect('/login?invalid');
        }
    })

login.get('/logout',
    async (c) => {

        const cookie = c.var.auth;
        if (!cookie) {
            c.status(404); return;
        }

        const auth: IAuthentication = {
            id: cookie.id,
            username: cookie.username,
            timestamp: 0, // logout
            counter: cookie?.counter || 1,
            lastConnectionTime: cookie.lastConnectionTime,
        }
        await setSignedCookie(c, 'authentication', JSON.stringify(auth), secrets.default.key);
        return c.redirect('/login');
    }
)

export default login;