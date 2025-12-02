import * as fs from "node:fs";
import * as path from "node:path";
import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, isCustomizationProfileManifest } from "./validation.js";
import { createProfilePackageZip } from "./packager.js";

import 'dotenv/config';

const main = () => {

    if (process.argv.length !== 5) {
        console.error(`usage: ${process.argv[0]} ${process.argv[1]} --signed=[false|true] inputDirectory outputDirectory`);
        process.exit(1);
    }

    const signed = process.argv[2]?.startsWith("--signed") ? process.argv[2] === "--signed=true" : undefined;
    if (signed === undefined) {
        console.error(`usage: ${process.argv[0]} ${process.argv[1]} --signed=[false|true] inputDirectory outputDirectory`);
        process.exit(1);
    }
    const inputDir = path.resolve(process.cwd(), process.argv[3] || "");
    const outputDir = path.resolve(process.cwd(), process.argv[4] || "");
    
    if (!(inputDir || fs.existsSync(inputDir))) {
        process.stderr.write("No input package directory found, exit\n");
        process.exit(1);
    }

    if (!(fs.existsSync(outputDir) && fs.statSync(outputDir).isDirectory())) {
        process.stderr.write("No output directory found, exit\n");
        process.exit(1);
    }

    const manifestPath = path.resolve(inputDir, "manifest.json");
    const manifestStr = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestStr);
    
        const resourcesMap: Array<[string, string]> = [];

    const toBeVisit = ["./"];
    while (toBeVisit.length) {

        const dirPath = toBeVisit.shift() || "";
        const dirAbsolutePath = path.join(inputDir, dirPath);
        const fileNameArray = fs.readdirSync(dirAbsolutePath);
        for (const fileName of fileNameArray) {
            const filePath = path.join(dirPath, fileName);
            const fileAbsolutePath = path.join(inputDir, filePath);
            const stat = fs.statSync(fileAbsolutePath);
            if (stat.isDirectory()) {
                toBeVisit.push(filePath);
            } else {
                if (filePath !== "manifest.json")
                    resourcesMap.push([fileAbsolutePath, filePath]);
            }
        }
    } // BFS

    if (!isCustomizationProfileManifest(manifest)) {

        console.error(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
        process.exit(1);
    }

    const manifestResources: string[] = [];

    for (const img of manifest.images || []) {
        const href = (img as any)?.href;
        if (href.startsWith("./")) {
            manifestResources.push(path.join("./", href));
        }
    }
    for (const ln of manifest.links || []) {
        const href = (ln as any).href;
        if (href.startsWith("./")) {
            manifestResources.push(path.join("./", href));
        }
    }
    for (const pub of manifest.publications || []) {
        for (const ln of (pub as any).images || []) {
            const href = ln.href;
            if (href.startsWith("./")) {
                manifestResources.push(path.join("./", href));
            }
        }
        for (const ln of (pub as any).links || []) {
            const href = ln.href;
            if (href.startsWith("./")) {
                manifestResources.push(path.join("./", href));
            }
        }
    }
    // TODO: Do you need to block external request (http) to ressources, local only !?

    const resourcesFiltered = resourcesMap.filter(([, filePath]) => manifestResources.includes(filePath));

    console.log("ressourcesMapFromDirectory:");
    console.log(resourcesMap);

    console.log("manifestRessources:");
    console.log(manifestResources);

    console.log("resourcesFiltered:");
    console.log(resourcesFiltered);

    createProfilePackageZip(manifest, resourcesFiltered, outputDir, signed, true).then((outPath) => {
        console.log("OUTPUT=", outPath);
    }).catch((e) => console.error("ERROR!? ", e));


    console.log("manifest: ", JSON.stringify(manifest, null, 4));
};

if (import.meta?.main) {
    main();
}
