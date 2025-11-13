import { simpleGit, type SimpleGit } from "simple-git";

export const gitInstance = (gitbaseDir: string) => {
    
    let git: SimpleGit;
    try {
        git = simpleGit({ baseDir: gitbaseDir, binary: process.env.__GIT_PATH || "git" });
        return git;
    } catch (e) {
        throw new Error("ERROR [GIT]: " + e);
    }
} 

export const gitPull = async (git: SimpleGit, branch: string) => {

    const pull = await git.pull("origin", branch);
    console.log("GIT pull=", pull);
}

export const gitClone = async (git: SimpleGit, accessToken: string, gitbaseDir: string, branch: string) => {

    const clone = await git.raw("clone", "--depth", "1", "--single-branch", "-b", branch, `https://x-access-token:${accessToken}@github.com/panaC/customization-profile-data.git`, gitbaseDir);
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