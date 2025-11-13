
import { Hono } from 'hono'
import { Layout } from '../view/layout.js';
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';


const profile = new Hono()
    .use(authenticationMiddleware);

profile.get('/',
    gitMiddleware,
    async (c) => {

        console.log("GIT=", c.var.git);
        // const git = gitInstance("/tmp");
        // git.clone("https://github.com/edrlab/thorium-reader.git", "/tmp/git-repo2",{ '--depth':1 });
        

        return c.html(
            <Layout title='Profile'>
                <h1>Profile section</h1>
            </Layout>);
    });

export default profile;