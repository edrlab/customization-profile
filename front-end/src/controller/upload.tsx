
import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';
import * as fsp from "node:fs/promises";
import { validator } from 'hono/validator';
// import * as path from "node:path"
// import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, __DEFAULT_MANIFEST_TEMPLATE, isCustomizationProfileManifest, type ICustomizationManifest } from '../model/manifest.js';
// import { validator } from 'hono/validator';
// import { gitAdd, gitCommit, gitDiffNoPager, gitLog, gitPush } from '../model/git/cmd.js';

const upload = new Hono()
    .use(authenticationMiddleware);

upload.on(['GET', 'POST'], '/',
    gitMiddleware,
    validator('form', (value) => {

        console.log("[VALIDATOR] value=", value);

        if (value.binaryFile) {
            return value.binaryFile as File;
        }

        return undefined;
    }),
    async (c) => {

    console.log("GIT=", c.var.git);
    console.log("GIT directory=", c.var.gitDirectory);

    const _files: [filePath:string,fileName:string,directory:boolean][] = [];
    try {

        const files = await fsp.readdir(c.var.gitDirectory, { recursive: true, withFileTypes: true, encoding: "utf-8" });

        for (const file of files) {
            if (file.isDirectory()) {
                if (!(file.name === ".git" || file.parentPath.includes("/.git"))) {
                    _files.push([file.parentPath, file.name, true]);
                }
            } else {
                if (!file.parentPath.includes("/.git")) {
                    _files.push([file.parentPath, file.name, false]);
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    _files.sort(([a], [b]) => a.localeCompare(b));

        console.log("Files:", _files);
        const binaryFile = c.req.valid('form');

        return c.render(
            <>
                <h1>Upload:</h1>
                <form method="post" id="binaryForm" enctype="multipart/form-data" hx-swap="outerHTML" hx-target="#binaryForm">
                    <input hx-preserve id="someId" type="file" name="binaryFile" />
                    <button hx-confirm={`do you want to commit this file?`} hx-put="/upload/file" type="submit">commit the file</button>
                </form>
                {
                    binaryFile
                        ? <div>
                            <p>uploaded: "{binaryFile.name}" size={Math.round(binaryFile.size / 1024)}ko type={binaryFile.type}</p>
                        </div>
                        : <></>
                }

                <hr></hr>

                <h4>Files:</h4>
                <table aria-label="File list">
                    <thead>
                        <tr>
                            <th>Directory</th>
                            <th>File Path</th>
                            <th>File Name</th>
                            {/* <th>Size</th> */}
                            {/* <th>Type</th> */}
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            _files.map(([filePath, fileName, directory]) => {

                                const filePathRelative = filePath.substring(c.var.gitDirectory.length);
                                const filePathRelativeFull = filePathRelative + "/" + fileName;
                                return (
                                    <tr id={filePathRelativeFull}>
                                        <td>{directory ? "Yes" : "No"}</td>
                                        <td>{filePathRelative ? filePathRelative : "/"}</td>
                                        <td>{fileName}</td>
                                        <td><button hx-confirm={`do you want to remove "${filePathRelativeFull}"?`} hx-delete={"/upload/delete?filename=" + encodeURI(filePathRelativeFull)}>X</button></td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </>
        );
    });


export default upload;