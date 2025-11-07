import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

//#if __NODE__
import { serveStatic } from '@hono/node-server/serve-static';
//#elif __DENO__
//import { serveStatic } from 'hono/deno';
//#elif __BUN__
//import { serveStatic } from 'hono/bun';
//#else
//KO
//#endif

import login from './controller/login.js'
import profile from './controller/profile.js'
import { gitInitTest } from './model/git/init.js';

const app = new Hono()

app.use(logger());

app.use('/third-party/**/*', serveStatic({
  root: "./",
  onFound: (_, c) => {
    c.header('Cache-Control', `public, immutable, max-age=31536000`)
  },
}))
app.route('/login', login);
app.route('/profile', profile);

app.get('/info', async (c) => {
  //@ts-ignore
  return c.json((await import("./gitrevision.json", { with: { type: "json" } })).default);
});

app.get('/git', async (c) => {
  await gitInitTest();
  return c.html("OK");
});


//#if __NODE__
serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || "3000", 10),
}, (info) => {
  console.log(`Listening on http://${info.address}:${info.port}`) // Listening on http://localhost:3000
});
//#elif __DENO__
//Deno.serve({ port: parseInt(process.env.PORT || "3000", 10) }, app.fetch) 
//export default app;
//#elif __BUN__
//export default { 
// port: parseInt(process.env.PORT || "3000", 10), 
// fetch: app.fetch, 
//}
//#else
//KO
//#endif