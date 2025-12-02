import fs from "fs";
import path from "path";


let profileSchemaJson = "";
try {
    const profileSchemaPath = path.resolve(process.cwd(), "../schema/profile.schema.json");
    profileSchemaJson = JSON.parse(fs.readFileSync(profileSchemaPath, "utf8"));
} catch (e) {
    console.log("schema/profile.schema.json not found !?");
    console.error(e);
    process.exit(1);
}


const isAnURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

const table = {
    "link.schema.json": "https://readium.org/webpub-manifest/schema/link.schema.json",
    "language-map.schema.json": "https://readium.org/webpub-manifest/schema/language-map.schema.json",
    "altIdentifier.schema.json": "https://readium.org/webpub-manifest/schema/altIdentifier.schema.json",
    "a11y.schema.json": "https://readium.org/webpub-manifest/schema/a11y.schema.json",
    "contributor.schema.json": "https://readium.org/webpub-manifest/schema/contributor.schema.json",
    "subject.schema.json": "https://readium.org/webpub-manifest/schema/subject.schema.json",
    "acquisition-object.schema.json": "https://drafts.opds.io/schema/acquisition-object.schema.json",
    "contributor-object.schema.json": "https://readium.org/webpub-manifest/schema/contributor-object.schema.json",
    "subject-object.schema.json": "https://readium.org/webpub-manifest/schema/subject-object.schema.json",
}

async function BFS(json) {
    const queue = [json];
    const refs = new Map();

    let id = "";
    while (queue.length) {
        const obj = queue.shift();
        // console.log("Start Read: ", obj);

        if (obj && typeof obj === "object") {
            for (const [key, value] of Object.entries(obj)) {
                if (key === "$ref" && typeof value === "string") {
                    let url = isAnURL(value) ? value : !(value.startsWith("http") || value.startsWith("#/") || value.startsWith("extensions/")) ? table[value] : "";
                    console.log("refs:", url, "from value=", value);
                    if (url && !refs.has(url)) {
                        console.log("refs: ", url, "not found");
                        const refJson = await (await fetch(url)).json();
                        refs.set(url, refJson);
                        queue.push(refJson);
                    }
                } else if (typeof value === "object") {
                    queue.push(value);
                }
            }
        }
    }

    return refs;
}

BFS(profileSchemaJson).then((refs) => {

    console.log("Need to compact these references:");
    console.log(refs);

    const linkSchema = refs.get("https://readium.org/webpub-manifest/schema/link.schema.json");
    const languageMap = refs.get("https://readium.org/webpub-manifest/schema/language-map.schema.json");
    const propertiesOpdsSchema = refs.get("https://drafts.opds.io/schema/properties.schema.json");
    const metadataSchema = refs.get("https://readium.org/webpub-manifest/schema/metadata.schema.json");
    const pubSchema = refs.get("https://drafts.opds.io/schema/publication.schema.json");

    if (pubSchema) {
        /**
         * error from ajv
         * 
         * strict mode: missing type "object" for keyword "properties" at "https://drafts.opds.io/schema/publication.schema.json#/properties/links/contains" (strictTypes)
         * strict mode: missing type "object" for keyword "properties" at "https://drafts.opds.io/schema/publication.schema.json#/properties/images/allOf/0/contains" (strictTypes)
         */
        pubSchema.properties.links.contains.type = "object";
        pubSchema.properties.images.allOf[0].contains.type = "object";
    }

    const bfsrelativeToAbsoluteRefs = (base, obj) => {
        const queue = [obj];

        while (queue.length) {
            const o = queue.shift();
            for (const [key, value] of Object.entries(o)) {
                if (key === "$ref" && typeof value === "string" && !(value.startsWith("http") || value.startsWith("#/"))) {
                    o[key] = base + value;
                } else if (typeof value === "object") {
                    queue.push(value);
                }
            }
        }
    }
    
    if (metadataSchema) {
        // remove extension refs
        metadataSchema.allOf = undefined;

        bfsrelativeToAbsoluteRefs("https://readium.org/webpub-manifest/schema/", metadataSchema);
    }

    if (propertiesOpdsSchema) {

        bfsrelativeToAbsoluteRefs("https://drafts.opds.io/schema/", propertiesOpdsSchema);
    }
    if (languageMap) {
        if (linkSchema) {
            // PATCH: add languageMap reference to webpub link schema
            linkSchema.properties.title = {
                "$ref": "https://readium.org/webpub-manifest/schema/language-map.schema.json"
            };

            if (profileSchemaJson) {
                // PATCH: extension ref not supported and not downloaded in ajv, so let's remove it !
                linkSchema.properties.properties.allOf = [{
                    "$ref": "https://drafts.opds.io/schema/properties.schema.json"
                }];
            } else {
                linkSchema.properties.properties.allOf = [];
                console.error("NO OPDS PROPERTIE reference !!?");
            }
        } else {
            console.error("NO LINK SCHEMA, HAS IT IS REMOVED FROM THE REFS !?")
            process.exit(1);
        }
    } else {
        console.error("NO LANGUAGE MAP reference !?");
        process.exit(1);
    }

    const profileSchemaRefsJsonArray = [profileSchemaJson];
    for (const [key, value] of refs) {
        profileSchemaRefsJsonArray.push(value);
    } 

    const jsonSchemaDir = path.resolve(process.cwd(), "src/schema");
    try { fs.mkdirSync(jsonSchemaDir); } catch { };


    const jsonFilePath = path.resolve(jsonSchemaDir, "profile.extended.schema.json");
    console.log("");
    console.log("create this file ", jsonFilePath);
    fs.writeFileSync(jsonFilePath, JSON.stringify(profileSchemaRefsJsonArray, null, 4), {encoding: "utf-8"});
})
