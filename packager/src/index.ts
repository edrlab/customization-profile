
import { Ajv } from "ajv";
import addFormats from "ajv-formats"
import type manifestType = require("./manifest.type");
import { customizationProfileManifestSchema } from "./profile.schema.js";
import * as fs from "node:fs";

let __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = "";
function isCustomizationProfileManifest(data: any): data is manifestType.ICustomizationManifest {

    const ajv = new Ajv();
    addFormats.default(ajv);

    const valid = ajv.validate(customizationProfileManifestSchema, data);

    __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

const main = () => {

    const manifestPath = process.argv[2];
    if (!manifestPath) {
        process.stderr.write("No package directory path, exit\n");
        process.exit(1);
    }

    const manifestStr = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestStr);

    console.log("IsManifest: ", isCustomizationProfileManifest(manifest));
    console.log(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
};

if (import.meta?.main) {
    main();
}

