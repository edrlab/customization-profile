import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

//#if __DEV__
import 'dotenv/config'
//#endif

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
// import { Layout } from './view/layout.js';

const app = new Hono()

app.use(logger());

app.use('/third-party/**/*', serveStatic({
  root: "./",
  onFound: (_, c) => {
    c.header('Cache-Control', `public, immutable, max-age=31536000`)
  },
}));

app.use('/dist/client/**/*', serveStatic({
  root: "./",
  // onNotFound((path) => {
  //   console.log("NOT FOUND", path);
  // }),
  onNotFound: (path) => {
    console.log("[NOT FOUND PATH=]", path);
  }
}));

app.use('*', async (c, next) => {
  c.setRenderer((content) => {
    return c.html(
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <link rel="stylesheet" href="/third-party/css/pico.classless.indigo.css" />
          <link rel="stylesheet" href="/third-party/css/gridlex.css" />
          <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js" defer></script>
          <script src="/dist/client/client.js" type="module"></script>
        </head>
        <body>
          <main>
            {content}
          </main>
        </body>
      </html>);
  });
  await next();
});

app.route('/login', login);
app.route('/profile', profile);

app.get("/health", (c) => {
  return c.html("ok");
});

app.notFound((c) => {
  c.status(404);
  return c.render(
    <>
      <title>404 Not Found</title>
      <h1>404 Not Found</h1>
    </>
  )
});

app.onError((err, c) => {
  console.error("[app.onError]:", err);
  c.status(500);
  return c.render(
    <>
      <title>500 internal server error</title>
      <h1>500 internal server error</h1>
      <pre>{err.stack || err.message}</pre>
      <p>Timestamp: {Date.now()}</p>
    </>
  );
})


//#if __NODE__
serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || "3000", 10),
}, (info) => {
  console.log(`Listening on http://${info.address}:${info.port}`) // Listening on http://localhost:3000
});
//#elif __DENO__
//Deno.serve({ port: parseInt(process.env.PORT || "3000", 10) }, app.fetch) 
//#elif __BUN__
//export default { 
// port: parseInt(process.env.PORT || "3000", 10), 
// fetch: app.fetch, 
//}
//#else
//KO
//#endif

// with tsx (jsx) comment at the end is not keeped (truncated) !
(() => {})(); // noop