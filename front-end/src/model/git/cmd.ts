import { simpleGit, type SimpleGit } from "simple-git";

export const gitInstance = (gitbaseDir: string) => {
    
    let git: SimpleGit;
    try {
        git = simpleGit({ baseDir: gitbaseDir, binary: process.env.__GIT_PATH || "git" });
        return git;
    } catch (e) {
        throw new Error(`ERROR [GIT]: ${String(e)}`);
    }
} 

export const gitPull = async (git: SimpleGit, branch: string) => {

    const pull = await git.pull("origin", branch);
    console.log("GIT pull=", pull);
}

export const gitClone = async (git: SimpleGit, accessToken: string, gitbaseDir: string, branch: string) => {

    const clone = await git.raw("clone", "--depth", "1", "--single-branch", "-b", branch, `https://x-access-token:${accessToken}@github.com/edrlab/customization-profile-data.git`, gitbaseDir);
    console.log("GIT clone=", clone);
}

export const gitStatus = async (git: SimpleGit) => {

    const status = await git.status();
    console.log("GIT status=", status);
}

export const gitBranch = async (git: SimpleGit) => {

    const branches = await git.branch();
    console.log("GIT branch=", branches);

    return branches.current;
}

export const gitUpdateRemoteOrigin = async (git: SimpleGit, accessToken: string) => {
    await git.removeRemote("origin");
    await git.addRemote("origin", `https://x-access-token:${accessToken}@github.com/panaC/customization-profile-data.git`);
}

export const gitListRemote = async(git: SimpleGit) => {
    const remotes = await git.listRemote(/*{ "origin": null }*/);
    console.log("GIT ls-remote", remotes);
}

export const gitRemoteShowOrigin = async (git: SimpleGit) => {
    const origin = await git.remote(["show", "origin"]);
    console.log("GIT remote show origin", origin);
    return origin;
}

export const gitShowRefBranch = async (git: SimpleGit, branch: string) => {
    // git show-ref --verify "refs/remotes/origin/$_BRANCH_NAME"
    const refs = await git.raw('show-ref', '--verify', `refs/remotes/origin/${branch}`);
    console.log(`GIT show-ref --verify "refs/remotes/origin/${branch} = `, refs);
}

export const gitCheckout = async (git: SimpleGit, branch: string) => {

    const fetch = await git.raw("fetch", "origin", branch);
    console.log("GIT fetch", fetch);
    const checkout = await git.raw("checkout", branch);
    console.log("GIT checkout", checkout);
}

export const gitAdd = async (git: SimpleGit, file: string) => {

    const add = await git.raw("add", file);
    console.log("GIT add " + file, add);
}

export const gitDiffNoPager = async (git: SimpleGit) => {

    const diff = await git.raw("--no-pager", "diff", "HEAD");
    return diff;
}

export const gitCommit = async (git: SimpleGit, message: string) => {

    const commit = await git.commit(message);
    console.log("GIT commit", commit);
    return commit;
}

export const gitPush = async (git: SimpleGit, branch: string) => {

    const push = await git.raw("push", "origin", branch);
    console.log("GIT push origin " + branch, push);
    return push;
}

export const gitLog = async (git: SimpleGit) => {

    const logs = await git.log();
    console.log("GIT logs", logs);
    return logs;
}

export const gitRm = async (git: SimpleGit, filePath: string) => {

    const rm = await git.raw("rm", "-rf", "--cached", filePath);
    console.log("GIT rm -rf --cached " + filePath, rm);
}