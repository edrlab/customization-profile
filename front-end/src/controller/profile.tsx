
import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';
import * as fsp from "node:fs/promises";
import * as path from "node:path"
import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, __DEFAULT_MANIFEST_TEMPLATE, isCustomizationProfileManifest, type ICustomizationManifest, type IStringMap } from '../model/manifest.js';
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
                <script src='/dist/client/profile.js'></script>
                {/* <script src='/node_modules/lit-html/lit-html.js'></script> */}
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

                    <fieldset>
                        <label for="title">Title</label>
                        <textarea
                            id="title"
                            name="title"
                            aria-invalid={undefined}
                        >{JSON.stringify(manifest.title, null, 4)}</textarea>
                    </fieldset>

                    <fieldset>
                        <label for="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            aria-invalid={undefined}
                            >{JSON.stringify(manifest.description, null, 4)}</textarea>
                    </fieldset>

                    {/* DARK THEME */}
                    <fieldset>
                        <label htmlFor="color-dark-neutral">Dark Neutral</label>
                        <input
                            id="color-dark-neutral"
                            name="color.dark.neutral"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.neutral}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-primary">Dark Primary</label>
                        <input
                            id="color-dark-primary"
                            name="color.dark.primary"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.primary}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-secondary">Dark Secondary</label>
                        <input
                            id="color-dark-secondary"
                            name="color.dark.secondary"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.secondary}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-border">Dark Border</label>
                        <input
                            id="color-dark-border"
                            name="color.dark.border"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.border}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-background">Dark Background</label>
                        <input
                            id="color-dark-background"
                            name="color.dark.background"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.background}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-appName">Dark App Name</label>
                        <input
                            id="color-dark-appName"
                            name="color.dark.appName"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.appName}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-scrollbarThumb">Dark Scrollbar Thumb</label>
                        <input
                            id="color-dark-scrollbarThumb"
                            name="color.dark.scrollbarThumb"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.scrollbarThumb}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-dark-buttonsBorder">Dark Buttons Border</label>
                        <input
                            id="color-dark-buttonsBorder"
                            name="color.dark.buttonsBorder"
                            placeholder="#000000"
                            value={manifest.theme.color.dark.buttonsBorder}
                        />
                    </fieldset>


                    {/* LIGHT THEME */}
                    <fieldset>
                        <label htmlFor="color-light-neutral">Light Neutral</label>
                        <input
                            id="color-light-neutral"
                            name="color.light.neutral"
                            placeholder="#000000"
                            value={manifest.theme.color.light.neutral}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-primary">Light Primary</label>
                        <input
                            id="color-light-primary"
                            name="color.light.primary"
                            placeholder="#000000"
                            value={manifest.theme.color.light.primary}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-secondary">Light Secondary</label>
                        <input
                            id="color-light-secondary"
                            name="color.light.secondary"
                            placeholder="#000000"
                            value={manifest.theme.color.light.secondary}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-border">Light Border</label>
                        <input
                            id="color-light-border"
                            name="color.light.border"
                            placeholder="#000000"
                            value={manifest.theme.color.light.border}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-background">Light Background</label>
                        <input
                            id="color-light-background"
                            name="color.light.background"
                            placeholder="#000000"
                            value={manifest.theme.color.light.background}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-appName">Light App Name</label>
                        <input
                            id="color-light-appName"
                            name="color.light.appName"
                            placeholder="#000000"
                            value={manifest.theme.color.light.appName}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-scrollbarThumb">Light Scrollbar Thumb</label>
                        <input
                            id="color-light-scrollbarThumb"
                            name="color.light.scrollbarThumb"
                            placeholder="#000000"
                            value={manifest.theme.color.light.scrollbarThumb}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="color-light-buttonsBorder">Light Buttons Border</label>
                        <input
                            id="color-light-buttonsBorder"
                            name="color.light.buttonsBorder"
                            placeholder="#000000"
                            value={manifest.theme.color.light.buttonsBorder}
                        />
                    </fieldset>

                    <fieldset>
                        <label htmlFor="links-input-hidden">Links</label>
                        <textarea id="links-input-hidden" /*style="display: none" hidden*/>{JSON.stringify(manifest.links, null, 4)}</textarea>
                        <div id="links-root"></div>
                        <button type="button" id="links-add-button" hidden>Add link</button>
                    </fieldset>

                    <fieldset>
                        <label htmlFor="publications-input-hidden">Publications</label>
                        <textarea id="publications-input-hidden" /*style="display: none" hidden*/>{JSON.stringify(manifest.publications, null, 4)}</textarea>
                        <div id="publications-root"></div>
                        <button type="button" id="publications-add-button" hidden>Add link</button>
                    </fieldset>

                    <fieldset>
                        <label htmlFor="images-input-hidden">Images</label>
                        <textarea id="images-input-hidden" /*style="display: none" hidden*/>{JSON.stringify(manifest.images, null, 4)}</textarea>
                        <div id="images-root"></div>
                        <button type="button" id="images-add-button" hidden>Add link</button>
                    </fieldset>

                    <button type="submit">submit</button>
                </form>

                <div id="output"></div>
            </>
        );
    });


profile.post('/',
    validator('form', (value, _c): [string | undefined, ICustomizationManifest | undefined] => {
        console.log("[VALIDATOR]: manifest data submission=", value);

        const newManifest: ICustomizationManifest = { ...__DEFAULT_MANIFEST_TEMPLATE };

        if (value.version) {
            newManifest.version = value.version as string;
        }

        if (value.title) {
            newManifest.title = JSON.parse(value.title as string) as IStringMap;
        }

        if (value.description) {
            newManifest.description = JSON.parse(value.description as string) as IStringMap;
        }

        newManifest.theme = newManifest.theme || {};
        newManifest.theme.color = newManifest.theme.color || {};
        newManifest.theme.color.dark = newManifest.theme.color.dark || {};

        if (value["color.dark.neutral"]) {
            newManifest.theme.color.dark.neutral = value["color.dark.neutral"] as string;
        }

        if (value["color.dark.primary"]) {
            newManifest.theme.color.dark.primary = value["color.dark.primary"] as string;
        }

        if (value["color.dark.secondary"]) {
            newManifest.theme.color.dark.secondary = value["color.dark.secondary"] as string;
        }

        if (value["color.dark.border"]) {
            newManifest.theme.color.dark.border = value["color.dark.border"] as string;
        }

        if (value["color.dark.background"]) {
            newManifest.theme.color.dark.background = value["color.dark.background"] as string;
        }

        if (value["color.dark.appName"]) {
            newManifest.theme.color.dark.appName = value["color.dark.appName"] as string;
        }

        if (value["color.dark.scrollbarThumb"]) {
            newManifest.theme.color.dark.scrollbarThumb = value["color.dark.scrollbarThumb"] as string;
        }

        if (value["color.dark.buttonsBorder"]) {
            newManifest.theme.color.dark.buttonsBorder = value["color.dark.buttonsBorder"] as string;
        }

        if (value["color.light.neutral"]) {
            newManifest.theme.color.light.neutral = value["color.light.neutral"] as string;
        }

        if (value["color.light.primary"]) {
            newManifest.theme.color.light.primary = value["color.light.primary"] as string;
        }

        if (value["color.light.secondary"]) {
            newManifest.theme.color.light.secondary = value["color.light.secondary"] as string;
        }

        if (value["color.light.border"]) {
            newManifest.theme.color.light.border = value["color.light.border"] as string;
        }

        if (value["color.light.background"]) {
            newManifest.theme.color.light.background = value["color.light.background"] as string;
        }

        if (value["color.light.appName"]) {
            newManifest.theme.color.light.appName = value["color.light.appName"] as string;
        }

        if (value["color.light.scrollbarThumb"]) {
            newManifest.theme.color.light.scrollbarThumb = value["color.light.scrollbarThumb"] as string;
        }

        if (value["color.light.buttonsBorder"]) {
            newManifest.theme.color.light.buttonsBorder = value["color.light.buttonsBorder"] as string;
        }

        console.log("generated manifest:");
        console.log(newManifest);

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

