
import { Hono } from 'hono'
import { Layout } from '../view/layout.js';
import { validator } from 'hono/validator';
import { authenticationValidatorFunction } from './authentication.validator.js';
// import { validator } from 'hono/validator'
// import * as secrets from "../../secrets.json" with { type: "json" };

const profile = new Hono();

profile.get('/',
    validator('cookie', authenticationValidatorFunction),
    (c) => {
        if (!c.req.valid('cookie').auth) {
            return c.redirect('/login');
        }
        return c.html(
            <Layout title='Profile'>
                <h1>Profile section</h1>
            </Layout>);
    });

export default profile;