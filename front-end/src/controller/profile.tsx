
import { Hono } from 'hono'
import { Layout } from '../view/layout.js';
import { validator } from 'hono/validator';
import { authenticationValidatorFunction } from './authentication.validator.js';
import { githubAppAuthentication } from '../model/git/auth.js';
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import * as fs from "node:fs";
import { gitBranch, gitClone, gitInit, gitListRemote, gitPull, gitRemoteShowOrigin, gitStatus, gitUpdateRemoteOrigin } from '../model/git/cmd.js';
import type { IAuthentication } from '../model/authentication.js';

import * as secrets from "../secrets.json" with { type: "json" };
import { setSignedCookie } from 'hono/cookie';

const profile = new Hono();

profile.get('/',
    validator('cookie', authenticationValidatorFunction),
    // async (_, next) => {
    //     // midleware start
    //     await next();
    //     // midleware end
    // },
    async (c) => {

        const { cookie: cookieData, auth } = c.req.valid('cookie');
        if (!auth) {
            return c.redirect('/login');
        }

        if (!cookieData?.sessionId) {
            throw new Error("No cookie sessionId !");
        }
        console.log(`cookie sessionId=${cookieData.sessionId}`);

        const privateKey = process.env.__GITHUB_APP_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("No Private Key!");
        }

        const gitVolumePath = process.env.__GIT_VOLUME || "/git-volume";
        console.log(`GitVolumePath=${gitVolumePath}`);
        if (!gitVolumePath) {
            throw new Error("Volume path not defined :" + gitVolumePath);
        }
        try {
            await fsp.access(gitVolumePath, fs.constants.W_OK | fs.constants.R_OK);
        } catch (e) {
            throw new Error(`No access to the volume path: ${gitVolumePath}, ${e}`);
        }

        let empty = false;
        try {
            const entries = await fsp.readdir(gitVolumePath, { withFileTypes: true });

            const directories = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            console.log(`List directories from ${gitVolumePath}`, directories);

            if (!directories.includes(cookieData.sessionId)) {
                empty = true;
                console.log("sessionId git repo not found");
            }
        } catch (e) {
            throw new Error("Critical error with the FileSystem, the git volume cannot be read")
        }

        const gitbaseDir = path.join(gitVolumePath, cookieData.sessionId);
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
                    console.error(`Not removed: ${e}`);
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
                console.error(`cannot create directory=${gitbaseDir}, error=${e}`);
                throw new Error(`Critical error with the FileSystem, cannot create directory=${gitbaseDir}`);
            }
        }
        const git = await gitInit(gitbaseDir);

        try {
            await gitStatus(git);
        } catch (e) {
            console.error(`Cannot read the git repo (status error), Error:${e}`);
            try {
                await fsp.rm(gitbaseDir, { recursive: true, force: true });
            } catch (e) {
                console.error(`Not removed: ${e}`);
                throw new Error("Critical error with the FileSystem, the directory cannot be removed");
            } finally {
                empty = true;
            }
        }

        let githubAppAuthenticationDone = false;
        const getAccessToken = async () => {
            const { accessToken, expiresAt } = await githubAppAuthentication("2266048", "Iv23liRWL5nzrIEuBv5U", privateKey);
            const auth: IAuthentication = { ...cookieData, expiresAt };
            console.log(`Set signed Cookie=${JSON.stringify(auth)}`);
            await setSignedCookie(c, 'authentication', JSON.stringify(auth), secrets.default.key);

            if (!accessToken) {
                throw new Error("No Access-Token generated");
            }
            githubAppAuthenticationDone = true;
            return accessToken;
        }

        if (empty) {
            const accessToken = await getAccessToken();
            try {
                await gitClone(git, accessToken, gitbaseDir);
            } catch (e) {
                throw new Error(`Git Clone Error=${e}`);
            }
            console.log("Git Clone Finish");

            try {
                const entries = await fsp.readdir(gitVolumePath, { withFileTypes: true });

                const directories = entries
                    .filter(entry => entry.isDirectory())
                    .map(entry => entry.name);

                console.log('List directories from ${', directories);

                if (!directories.includes(cookieData.sessionId)) {
                    throw new Error(`directory=${cookieData.sessionId} not found after git cloning`);
                }
            } catch (e) {
                throw new Error("Critical error with the FileSystem, the git volume cannot be read")
            }
        } else {
            if (cookieData.expiresAt && Date.now() <= Date.parse(cookieData.expiresAt)) {
                console.log(`github app authentication access-token not expired, date=${cookieData.expiresAt}`);
            } else {
                console.log(`cookieData.expiresAt="${cookieData.expiresAt}" is not defined or revoked`);
                const accessToken = await getAccessToken();
                try {
                    gitUpdateRemoteOrigin(git, accessToken);
                    await gitListRemote(git);
                    await gitRemoteShowOrigin(git);
                } catch (e) {
                    throw new Error(`Cannot update the git remote Error:${e}`);
                }
            }
        }

        console.log("Check git remote access");
        try {
            await gitPull(git, "main"); //TODO : branch name?
            await gitStatus(git);
            await gitBranch(git);
        } catch (e) {
            console.error(`exception error with the git remote to access it, error=${e}`);

            if (githubAppAuthenticationDone) {
                throw new Error("GithubApp Authentication already done but no git remote access");
            }
            const accessToken = await getAccessToken();

            console.log("update remote origin with the new accessToken");
            try {
                gitUpdateRemoteOrigin(git, accessToken);
                await gitListRemote(git);
                await gitRemoteShowOrigin(git);
            } catch (e) {
                throw new Error(`Cannot update the git remote Error:${e}`);
            }
            try {
                console.log("Check git remote access (2)");
                await gitPull(git, "main"); // TODO: branch name
                await gitStatus(git);
                await gitBranch(git);
            } catch (e) {
                throw new Error(`Critical error with the git remote access`);
            }
        }

        console.log("git remote ready !");

        return c.html(
            <Layout title='Profile'>
                <h1>Profile section</h1>
            </Layout>);
    });

export default profile;