
import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';
import * as fsp from "node:fs/promises";
import * as path from "node:path"
import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, __DEFAULT_MANIFEST_TEMPLATE, isCustomizationProfileManifest, type ICustomizationManifest } from '../model/manifest.js';
import { validator } from 'hono/validator';
import { Manifest } from '../view/manifest.js';
// import { Manifest } from '../view/manifest.js';

const profile = new Hono()
    .use(authenticationMiddleware);

profile.on(['GET', 'POST'], '/',
    validator('form', (value, _c) => {
        console.log("[VALIDATOR]: manifest data submission=", value);

        const newManifest = { ...__DEFAULT_MANIFEST_TEMPLATE, ...value };

        if (!isCustomizationProfileManifest(newManifest)) {
            throw new Error(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
        }

        return newManifest;
    }),
    gitMiddleware,
    async (c) => {

        console.log("GIT=", c.var.git);
        console.log("GIT directory=", c.var.gitDirectory);

        let manifest: ICustomizationManifest = c.req.valid('form') || __DEFAULT_MANIFEST_TEMPLATE;
        if (c.req.valid('form')) {
            console.log("POST Request !?");
            console.log("manifest received", manifest);
            console.log("GIT COMMIT MANIFEST");

        }
        
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
                <Manifest version={{ value: manifest.version, error: false, msg: "" }} />
            </>
        );
    });

export default profile;

