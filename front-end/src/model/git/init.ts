import { githubAppAuthentication } from './auth.js';
import type { SimpleGit } from "simple-git";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import * as fs from "node:fs";
import { gitBranch, gitCheckout, gitClone, gitInstance, gitListRemote, gitPull, gitRemoteShowOrigin, gitShowRefBranch, gitUpdateRemoteOrigin } from './cmd.js';
import type { IAuthentication } from '../cookie.js';

import * as secrets from "../../secrets.json" with { type: "json" };

export const gitInit = async (auth: IAuthentication, sessionId: string, expiresAt: string): Promise<{ git: SimpleGit, expiresAt: string, gitbaseDir: string }> => {

    const user = secrets.default.users.find(({ id }) => auth.id === id);
    if (!user) {
        throw new Error("No User Found !");
    }
    const branchName = `_group/${user.group}/profile/${user.profile}/dev`;

    if (!sessionId) {
        throw new Error("No cookie sessionId !");
    }
    console.log(`cookie sessionId=${sessionId}`);

    const privateKey = process.env.__GITHUB_APP_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("No Private Key!");
    }

    const gitVolumePath = process.env.__GIT_VOLUME || "/git-volume";
    console.log(`GitVolumePath=${gitVolumePath}`);
    if (!gitVolumePath) {
        throw new Error("Volume path not defined :" + gitVolumePath);
    }
    await fsp.access(gitVolumePath, fs.constants.W_OK | fs.constants.R_OK);

    let empty = false;
    try {
        const entries = await fsp.readdir(gitVolumePath, { withFileTypes: true });

        const directories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        console.log(`List directories from ${gitVolumePath}`, directories);

        if (!directories.includes(sessionId)) {
            empty = true;
            console.log("sessionId git repo not found");
        }
    } catch (e) {
        throw new Error("Critical error with the FileSystem, the git volume cannot be read")
    }

    const gitbaseDir = path.join(gitVolumePath, sessionId);
    console.log("set git base dir to", gitbaseDir);
    if (!empty) {
        console.log("Not an empty directory, check read/write access");
        try {
            await fsp.access(gitbaseDir, fs.constants.W_OK | fs.constants.R_OK);
        } catch (e) {
            console.error("Read/Write failure, force removing directory");
            try {
                await fsp.rm(gitbaseDir, { recursive: true, force: true });
            } catch (e) {
                console.error(`Not removed: ${String(e)}`);
                throw new Error("Critical error with the FileSystem, the directory cannot be removed");
            } finally {
                empty = true;
            }
        }
    }

    if (empty) {
        try {
            console.log(`mkdir=${gitbaseDir}`);
            await fsp.mkdir(gitbaseDir);
        } catch (e) {
            console.error(`cannot create directory=${gitbaseDir}, error=${String(e)}`);
            throw new Error(`Critical error with the FileSystem, cannot create directory=${gitbaseDir}`);
        }
    }

    const dotGitPath = path.join(gitbaseDir, ".git");
    try {
        await fsp.access(dotGitPath, fs.constants.W_OK | fs.constants.R_OK);
    } catch (e) {
        console.error(`no git repo found in ${gitbaseDir}`);
        try {
            await fsp.rm(dotGitPath, { recursive: true, force: true });
        } catch (e) {
            console.error(`Not removed: ${String(e)}`);
            throw new Error("Critical error with the FileSystem, the directory cannot be removed");
        } finally {
            empty = true;
        }
    }

    let githubAppAuthenticationDone = false;
    const githubAuthentication = async () => {
        const { accessToken, expiresAt } = await githubAppAuthentication("2266048", "Iv23liRWL5nzrIEuBv5U", privateKey);
        if (!accessToken) {
            throw new Error("No Access-Token generated");
        }
        githubAppAuthenticationDone = true;
        return { accessToken, expiresAt } ;
    }

    const git = gitInstance(gitbaseDir);
    if (empty) {
        const githubAuthResult = await githubAuthentication();
        const accessToken = githubAuthResult.accessToken;
        expiresAt = githubAuthResult.expiresAt;
        try {
            await gitClone(git, accessToken, gitbaseDir, branchName);
        } catch (e) {
            throw new Error(`Git Clone Error=${String(e)}`);
        }
        console.log("Git Clone Finish");

        try {
            const entries = await fsp.readdir(gitVolumePath, { withFileTypes: true });

            const directories = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            console.log('List directories from ${', directories);

            if (!directories.includes(sessionId)) {
                throw new Error(`directory=${sessionId} not found after git cloning`);
            }
        } catch (e) {
            throw new Error("Critical error with the FileSystem, the git volume cannot be read")
        }
    } else {
        if (expiresAt && Date.now() <= Date.parse(expiresAt)) {
            console.log(`github app authentication access-token not expired, date=${expiresAt}`);
        } else {
            console.log(`cookieData.expiresAt="${expiresAt}" is not defined or revoked`);
            const githubAuthResult = await githubAuthentication();
            const accessToken = githubAuthResult.accessToken;
            expiresAt = githubAuthResult.expiresAt;
            try {
                await gitUpdateRemoteOrigin(git, accessToken);
                await gitListRemote(git);
                await gitRemoteShowOrigin(git);
            } catch (e) {
                throw new Error(`Cannot update the git remote Error:${String(e)}`);
            }
        }
    }

    const currentRepoBranchName = await gitBranch(git);
    if (!(currentRepoBranchName && currentRepoBranchName === branchName)) {
        await gitShowRefBranch(git, branchName);
        await gitCheckout(git, branchName);
    } else {
        const currentRepoBranchName = await gitBranch(git);
        if (!(currentRepoBranchName && currentRepoBranchName === branchName)) {
            throw new Error(`Git repo not on the current branch=${branchName}`);
        }
    }

    console.log("Check git remote access");
    try {
        await gitPull(git, branchName);
    } catch (e) {
        console.error(`exception error with the git remote to access it, error=${String(e)}`);

        if (githubAppAuthenticationDone) {
            throw new Error("GithubApp Authentication already done but no git remote access");
        }
        const githubAuthResult = await githubAuthentication();
        const accessToken = githubAuthResult.accessToken;
        expiresAt = githubAuthResult.expiresAt;

        console.log("update remote origin with the new accessToken");
        try {
            await gitUpdateRemoteOrigin(git, accessToken);
            await gitListRemote(git);
            await gitRemoteShowOrigin(git);
        } catch (e) {
            throw new Error(`Cannot update the git remote Error:${String(e)}`);
        }
        try {
            console.log("Check git remote access (2)");
            await gitPull(git, branchName);
        } catch (e) {
            throw new Error(`Critical error with the git remote access`);
        }
    }

    return {
        git,
        expiresAt,
        gitbaseDir,
    }
}