import { simpleGit } from "simple-git";
// import * as fsp from "fs/promises";
import * as fs from "fs";


export const gitCloneRepo = async (accessToken: string, gitbaseDir: string /* volume pwd + sessionId*/) => {


    let empty = false;
    if (fs.existsSync(gitbaseDir)) {
        console.log("[GIT]: git-repo directory exists");
    } else {
        console.log("[GIT]: NO git-repo directory");
        fs.mkdirSync(gitbaseDir);
        empty = true;
    }

    const git = simpleGit({ baseDir: gitbaseDir });
    console.log("GIT=", git);

    if (empty) {
        await git.clone(`https://x-access-token:${accessToken}@github.com/panaC/customization-profile-data.git`, gitbaseDir, { '--depth': 1, '--no-single-branch': null });
    }

    {
        const status = await git.status();
        console.log("GIT status=", status);
    }

    {
        const branches = await git.branch();
        console.log("GIT branch=", branches);
    }

}