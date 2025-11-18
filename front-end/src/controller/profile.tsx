
import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';
import * as fsp from "node:fs/promises";
import * as path from "node:path"
import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, __DEFAULT_MANIFEST_TEMPLATE, isCustomizationProfileManifest, type ICustomizationManifest } from '../model/manifest.js';
import { validator } from 'hono/validator';
import { gitAdd, gitCommit, gitDiffNoPager, gitLog, gitPush } from '../model/git/cmd.js';

const profile = new Hono()
    .use(authenticationMiddleware);

profile.get('/',
    gitMiddleware,
    async (c) => {

        console.log("GIT=", c.var.git);
        console.log("GIT directory=", c.var.gitDirectory);

        let manifest = __DEFAULT_MANIFEST_TEMPLATE;
        try {
            const manifestPath = path.join(c.var.gitDirectory, "manifest.json");
            const manifestString = await fsp.readFile(manifestPath, { encoding: "utf-8" });
            const manifestParsed = JSON.parse(manifestString) as ICustomizationManifest;
            if (!isCustomizationProfileManifest(manifestParsed)) {
                throw new Error(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
            }
            manifest = manifestParsed;
        } catch (e) {
            console.error(`Read and/or parse manifest.json, ${String(e)}`);
        }

        return c.render(
            <>

                <title>profile</title>
                <div class="grid">
                    <a href='/upload'>Upload file</a>
                </div>
                <hr/>
                <form hx-post="/profile" hx-target="#output">
                    <fieldset>
                        <label for="version">Version</label>
                        <input
                            id="version"
                            name="version"
                            placeholder="1.0.0"
                            value={manifest.version}
                            aria-invalid={undefined}
                        />
                    </fieldset>

                    <input
                        type="submit"
                        value="commit"
                    />
                </form>
                <div id="output"></div>
            </>
        );
    });


profile.post('/',
    validator('form', (value, _c): [string | undefined, ICustomizationManifest | undefined] => {
        console.log("[VALIDATOR]: manifest data submission=", value);

        const newManifest = { ...__DEFAULT_MANIFEST_TEMPLATE, ...value };

        if (!isCustomizationProfileManifest(newManifest)) {
            return [__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, undefined];
        }

        return [undefined, newManifest];
    }),
    async (c) => {

        const errors = c.req.valid('form')[0];
        const manifest = c.req.valid('form')[1];
        if (errors) {
            console.log("manifest form data errors", errors);

            return c.html(
                <pre>{errors}</pre>
            )
        }

        if (manifest) {

            console.log("manifest received", manifest);
            console.log("GIT COMMIT MANIFEST");

            return c.html(
                <>
                    {/* <form> */}

                        <h6>Ready to commit !?</h6>
                        {/* <input type="test" name="output" readonly>{JSON.stringify(manifest, null, 4)}</input> */}
                        <textarea style="min-height: 500px" name="output" type="text" contentEditable>{JSON.stringify(manifest, null, 4)}</textarea>
                        <button hx-post="/profile/check" hx-include="[name='output']" /*hx-val={JSON.stringify(manifest)}*/ hx-target="#output-check">
                            commit
                        </button>

                    {/* </form> */}
                    <div id="output-check"></div>
                </>
            )

        }

        return c.status(400);

    });

profile.post('/check',
    gitMiddleware,
    validator('form', (value) => {
        console.log("[VALIDATION] Value", value);

        const manifestString = value.output;
        console.log("[VALIDATION] manifest", manifestString);


        if (typeof manifestString === "string") {

            try {
                const manifest = JSON.parse(manifestString);

                if (!isCustomizationProfileManifest(manifest)) {
                    return [__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, undefined];
                }
    
                return [undefined, manifest];
            } catch (e)  {
                return ["parse error", undefined];
            }

        }

        return ["value error", undefined];
    }),
    async (c) => {

        const git = c.var.git;
        console.log("GIT=", git);
        console.log("GIT directory=", c.var.gitDirectory);

        const errors = c.req.valid('form')[0];
        const manifest = c.req.valid('form')[1];
        console.log("COMMIT manifest", manifest);

        const manifestString = JSON.stringify(manifest, null, 4);

        if (errors) {
            return c.html(
                <pre>Error: {errors}</pre>
            )
        }

        const manifestPath = path.join(c.var.gitDirectory, "manifest.json");
        await fsp.writeFile(manifestPath, manifestString, { encoding: "utf-8" });

        await gitAdd(git, "manifest.json");
        const diff = await gitDiffNoPager(git);

        if (!diff) {
            return c.html(
                <pre>no data change, nothing to commit</pre>
            );
        }

        return c.html(
            <>
                <pre>{diff}</pre>
                <button hx-post="/profile/commit" hx-target="#output-commit">commit</button>
                <div id="output-commit"></div>

            </>
        )
    }
);

profile.post('/commit',
    gitMiddleware,
    async (c) => {

        const git = c.var.git;
        console.log("GIT=", git);
        console.log("GIT directory=", c.var.gitDirectory);
        console.log("GIT branchName=", c.var.branchName);

        const commitMessage = await gitCommit(git, "update manifest.json");

        const pushMessage = await gitPush(git, c.var.branchName);

        const logs = await gitLog(git);

        const res = `
COMMIT: "${commitMessage}"
PUSH: "${pushMessage}"
LOGS: "${JSON.stringify(logs, null, 4)}"
        `;

        return c.html(
            <>
                <h1>DONE</h1>
                <pre>{res}</pre>
            </>
        )
    }
);

export default profile;

