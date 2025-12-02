
import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import type profileManifest = require("./profileManifest.type.js");
import profileJsonSchemas from "./schema/profile.extended.schema.json" with { type: "json" };
import * as fs from "node:fs";

export let __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = "";
export function isCustomizationProfileManifest(data: any): data is profileManifest.IProfileManifest {

    const ajv = new Ajv({ schemas: profileJsonSchemas, allowUnionTypes: true });
    addFormats.default(ajv);

    const validate = ajv.getSchema("https://www.notion.so/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355");
    if (validate) {
        const valid = validate(data);
        console.log("valid=", valid, typeof valid === "object");
        console.log("AJV errors", ajv.errors);
        console.log("Validate errors", validate.errors);
        if (!valid) {
            __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = validate.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";
        }
        return valid as boolean;
    }

    throw new Error("root schema not available !!?");
}

const main = () => {

    const manifestPath = process.argv[2];
    if (!manifestPath) {
        process.stderr.write("No package directory path, exit\n");
        process.exit(1);
    }

    const manifestStr = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestStr);

    console.log("manifest:", JSON.stringify(manifest, null, 4));
    console.log("IsManifest: ", isCustomizationProfileManifest(manifest));
    console.log(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
};

if (import.meta?.main) {
    main();
}

