import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import * as path from "path";

// TODO: disable it with preprocessing variable __BUILD__ in build mode (not dev mode)
import 'dotenv/config'

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
import { githubAppAuthentication } from './model/git/auth.js';
import { gitCloneRepo } from './model/git/init.js';

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

  const privateKey = process.env.__GITHUB_APP_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No Private Key!");
  }
  const { accessToken, expiresAt: _ } = await githubAppAuthentication("2266048", "Iv23liRWL5nzrIEuBv5U", privateKey);

  // TODO: define a unique sessionId along the user cookie

  const gitVolumePath = process.env.__GIT_VOLUME || "/git-volume";
  if (!gitVolumePath) {
    // TODO check if path exists
    throw new Error("Not a valid volume path: " + gitVolumePath);
  }
  const gitbaseDir = path.join(gitVolumePath, "test");
  await gitCloneRepo(accessToken, gitbaseDir);
  return c.html("OK");
});

app.get("/health", (c) => {
  return c.html("ok");
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