import * as fs from "node:fs";
import * as path from "node:path";
// import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, isCustomizationProfileManifest } from "./validation.js";

const main = () => {

    const packagePath = process.argv[2];
    if (!packagePath) {
        process.stderr.write("No package directory path, exit\n");
        process.exit(1);
    }

    if (!fs.existsSync(packagePath)) {
        process.stderr.write("No package directory found, exit\n");
    }


    const manifestPath = path.resolve(packagePath, "manifest.json");
    const manifestStr = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestStr);
    

    console.log("manifest: ", JSON.stringify(manifest, null, 4));
};

if (import.meta?.main) {
    main();
}
