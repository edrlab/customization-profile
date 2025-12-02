// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

import { extractCrc32OnZip } from "./crc.js";
import { createSign, createVerify } from "crypto";

import { sanitizeForFilename } from "./safe-filename.js";
import { injectBufferInZip } from "./zipInjector.js";
import { createZip, type TResourcesFSCreateZip } from "./create.js";
import { convertMultiLangStringToString } from "./language-string.js";
import type { IProfileManifest } from "./profileManifest.type.js";

const EXT_THORIUM = ".thorium";

// Logger
const debug = debug_("readium-desktop:main#customization/packager");

const signManifest = (manifest: IProfileManifest) => {

    if (!process.env.PUB_KEY) {
        throw new Error("PUB_KEY not found!");
    }
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found!");
    }

    const manifestStringified = JSON.stringify(manifest);

    const sign = createSign("SHA256");
    sign.update(manifestStringified);
    sign.end();
    const signature = sign.sign(process.env.PRIVATE_KEY, "hex");

    return {
        key: process.env.PUB_KEY, // PUBLIC Not PRIVATE !?!
        value: signature,
        algorithm: "https://www.w3.org/2008/xmlsec/namespaces.html#ECKeyValue", // see scripts/profile-generate-key-pair.js
    };
};
const verifyManifest = (manifest: IProfileManifest) => {

    const signatureValue = manifest.signature?.value || "";
    const signatureKey = manifest.signature?.key || "";
    const stringifiedManifest = JSON.stringify({...manifest, signature: undefined});

    const verify = createVerify("SHA256");
    verify.write(stringifiedManifest);
    verify.end();
    const verified = verify.verify(signatureKey, signatureValue, "hex");
    return verified;
};
export async function createProfilePackageZip(
    manifest: IProfileManifest,
    resourcesMapFs: TResourcesFSCreateZip,
    outputProfilePath: string,
    signed = false,
    testSignature = false,
) {
    const packagePath = path.resolve(outputProfilePath,
        sanitizeForFilename((convertMultiLangStringToString(manifest.title, "en") || "profile") + "_" + (manifest.modified || manifest.created) + EXT_THORIUM),
    );
    // const packagePathTMP = packagePath + ".tmp";

    debug("Ouput path =", packagePath);

    if (resourcesMapFs.length) {
        await createZip(packagePath, resourcesMapFs, []);
        const contentHash = await extractCrc32OnZip(packagePath, "profile");
        debug("ZIP CRC = ", contentHash);
        manifest.contentHash = contentHash;
        manifest.signature = undefined;

        if (signed) {
            const signature = signManifest(manifest);
            debug("Manifest signed", JSON.stringify(signature));
            manifest.signature = signature;
        }
        const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 4));
        const packagePathTMP = packagePath + ".tmpzip";
        await new Promise<void>((resolve, reject) => {
            injectBufferInZip(
                packagePath,
                packagePathTMP,
                manifestBuffer,
                "manifest.json",
                (e: any) => {
                    debug("injectManifestToZip - injectBufferInZip ERROR!");
                    debug(e);
                    reject(e);
                },
                () => {
                    resolve();
                });
        });

        fs.unlinkSync(packagePath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
        fs.renameSync(packagePathTMP, packagePath);
        await new Promise<void>((resolve, _reject) => {
            setTimeout(() => {
                resolve();
            }, 200); // to avoid issues with some filesystems (allow extra completion time)
        });
    } else {
        manifest.contentHash = "";
        manifest.signature = undefined;

        if (signed) {
            const signature = signManifest(manifest);
            debug("Manifest signed", JSON.stringify(signature));
            manifest.signature = signature;
        }
        const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 4));
        await createZip(packagePath, resourcesMapFs, [[manifestBuffer, "manifest.json"]]);
    }


    if (signed && testSignature) {
        if (verifyManifest(manifest)) {
            debug("PASS!: Manifest Signed And Verifed");
        } else {
            throw new Error("KO ERRRO!: Manifest not verified after signature");
        }
    }


    return packagePath;
}
