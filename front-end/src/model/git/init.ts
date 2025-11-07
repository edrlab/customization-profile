import { simpleGit } from "simple-git";
import * as path from "path";
// import * as fsp from "fs/promises";
import * as fs from "fs";


export const gitInitTest = async () => {

    const gitbaseDir = path.join(process.cwd(), "git-repo");

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
        await git.clone('https://github.com/edrlab/customization-profile.git', gitbaseDir, { '--depth': 1, '--no-single-branch': null });
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