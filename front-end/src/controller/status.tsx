import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { fetchAllGithubActionRuns, getGithubActionRunStatus } from '../model/git/ci.js';
import { githubAuthentication } from '../model/git/auth.js';

const status_ = new Hono()
    .use(authenticationMiddleware);

status_.get('/',
    async (c) => {

        const { accessToken } = await githubAuthentication();
        const runs = await fetchAllGithubActionRuns(accessToken);

        const hash = c.req.query("hash");

        if (hash) {
            const status = getGithubActionRunStatus(runs, hash);
            console.log("GithubAction run status for", hash, status);
            return c.html(<>
                <h1>Github Action Run status:</h1>
                <pre>{JSON.stringify(status, null, 4)}</pre>
            </>)
        }

        return c.render(
            <>
                <title>status</title>
                <h1>status</h1>
                <pre>{JSON.stringify(runs, null, 4)}</pre>
            </>
        );
    });

export default status_;