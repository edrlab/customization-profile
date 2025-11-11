
import { Hono } from 'hono'
import { Layout } from '../view/layout.js';
import { Login } from '../view/login.js';
import { validator } from 'hono/validator'
import type { IAuthentication } from '../model/authentication.js';
import { authenticationValidatorFunction } from './authentication.validator.js';
import { setSignedCookie } from 'hono/cookie';
import * as secrets from "../secrets.json" with { type: "json" };
import { nanoid } from 'nanoid';

const login = new Hono();

login.get('/',
    validator('cookie', authenticationValidatorFunction),
    (c) => {

        if (c.req.valid("cookie").auth) {
            return c.redirect("/profile");
        }
        return c.html(
            <Layout title='Login'>
                <Login invalid={!!c.req.queries("invalid")} />
            </Layout>);
    });

login.post('/validate',
    validator('cookie', authenticationValidatorFunction),
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

        const { auth: _auth, cookie } = c.req.valid('cookie'); 

        if (user) {
            // authentication
            const auth: IAuthentication = {
                id: user.id,
                username: user.username,
                timestamp: Date.now(),
                counter: cookie?.counter || 1,
                lastConnectionTime: Date.now(),
                sessionId: cookie?.sessionId || nanoid(),
                expiresAt: "",
            }
            await setSignedCookie(c, 'authentication', JSON.stringify(auth), secrets.default.key);
            return c.redirect('/profile');
        } else {
            return c.redirect('/login?invalid');
        }
    })

login.get('/logout',
    validator('cookie', authenticationValidatorFunction),
    async (c) => {

        const { auth: authenticated, cookie } = c.req.valid('cookie'); 
        if (!authenticated) {
            return c.status(404);
        }

        const auth: IAuthentication = {
            id: cookie.id,
            username: cookie.username,
            timestamp: 0, // logout
            counter: cookie?.counter || 1,
            lastConnectionTime: cookie.lastConnectionTime,
            sessionId: cookie?.sessionId || nanoid(),
            expiresAt: "",
        }
        await setSignedCookie(c, 'authentication', JSON.stringify(auth), secrets.default.key);
        return c.redirect('/login');
    }
)

export default login;