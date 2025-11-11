import { simpleGit, type SimpleGit } from "simple-git";

export const gitInit = async (gitbaseDir: string) => {
    
    const git = simpleGit({ baseDir: gitbaseDir });
    return git;
} 

export const gitCheckout = async (git: SimpleGit, branchName: string) => {

    const checkout = await git.checkout(branchName);
    console.log("GIT checkout=", checkout);
}

export const gitPull = async (git: SimpleGit, branch: string) => {

    const pull = await git.pull("origin", branch);
    console.log("GIT pull=", pull);
}

export const gitClone = async (git: SimpleGit, accessToken: string, gitbaseDir: string) => {

    const clone = await git.clone(`https://x-access-token:${accessToken}@github.com/panaC/customization-profile-data.git`, gitbaseDir, { '--depth': 1, '--no-single-branch': null });
    console.log("GIT clone=", clone);
}

export const gitStatus = async (git: SimpleGit) => {

    const status = await git.status();
    console.log("GIT status=", status);
}

export const gitBranch = async (git: SimpleGit) => {

    const branches = await git.branch();
    console.log("GIT branch=", branches);
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