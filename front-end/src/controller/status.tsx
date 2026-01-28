import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { fetchAllGithubActionRuns, getGithubActionRunStatus } from '../model/git/ci.js';
import { gitMiddleware } from '../middleware/git.js';
import { gitRemoteShowOrigin } from '../model/git/cmd.js';

const status_ = new Hono()
    .use(authenticationMiddleware);

status_.get('/',
    gitMiddleware,
    async (c) => {

        // const { accessToken } = await githubAuthentication();

        const git = c.var.git;
        console.log("GIT=", git);

        const remote  = await gitRemoteShowOrigin(git) || "";

        const regex = /x-access-token:([^@]+)@/;
        const match = remote.match(regex);

        if (!match) {
            throw new Error("no accessToken match");
        }

        const accessToken = match[1];
        if (!accessToken) {
            throw new Error("no accessToken");
        }

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