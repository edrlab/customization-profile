import { html } from 'hono/html'

export const Layout = (props: {title: string, children?: any}) => {
    return html`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="/third-party/css/pico.classless.indigo.css">
    <link rel="stylesheet" href="/third-party/css/gridlex.css">
    <title>${props.title}</title>
  </head>
  <body>
    <main>
    ${props.children}
    </main>
  </body>
</html>
    `;
}