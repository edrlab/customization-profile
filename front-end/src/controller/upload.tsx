
import { Hono } from 'hono'
import { authenticationMiddleware } from '../middleware/authentication.js';
import { gitMiddleware } from '../middleware/git.js';
import * as fsp from "node:fs/promises";
import * as fs from "node:fs";
import { validator } from 'hono/validator';
import * as path from "node:path"
import { pipeline } from 'node:stream/promises';
// import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, __DEFAULT_MANIFEST_TEMPLATE, isCustomizationProfileManifest, type ICustomizationManifest } from '../model/manifest.js';
// import { validator } from 'hono/validator';
import { gitAdd, gitCommit, gitDiffNoPager, gitLog, gitPush, gitRm } from '../model/git/cmd.js';

const upload = new Hono()
    .use(authenticationMiddleware);

upload.on(['GET', 'POST'], '/',
    gitMiddleware,
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

        return c.render(
            <>
                <div class="grid">
                    <a href='/profile'>Profile</a>
                    <button id="open-dialog-upload">Upload file</button>
                    <button id="refresh-page">Refresh</button>
                </div>
                <dialog style={"flex-direction: column"}>
                    <div style={"display: flex;justify-content: space-between;width: inherit;max-width: 800px;"}>
                        <h4>Upload:</h4>
                        <button id="close-dialog-upload">Close</button>
                    </div>
                    <form method="post" id="upload-form" enctype="multipart/form-data" hx-swap="outerHTML" hx-confirm={`do you want to commit this file?`} hx-put="/upload/file" hx-target="#upload-file-output">
                        <input hx-preserve id="upload-file" type="file" name="uploadFile" />
                        <label for='filePath'>File Path:</label>
                        <input hx-preserve id="file-path" type="text" name="filePath" placeholder='/' />
                        <button type="submit">upload this file</button>
                        <progress id='progress' value='0' max='100'></progress>
                    </form>
                    <div id="upload-file-output"></div>
                </dialog>


                <hr></hr>

                <h4>Files:</h4>
                <table aria-label="File list">
                    <thead>
                        <tr>
                            {/* <th>Directory</th> */}
                            <th>File Path</th>
                            <th>File Name</th>
                            {/* <th>Size</th> */}
                            {/* <th>Type</th> */}
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            _files.filter(([,,dir]) => !dir).map(([filePath, fileName, _directory]) => {

                                // TODO: find a better algorithm than +1 tricky hack
                                const filePathRelative = filePath.substring(c.var.gitDirectory.length + 1);
                                const filePathRelativeFull = filePathRelative ? path.join(filePathRelative, fileName) : fileName;
                                return (
                                    <tr id={filePathRelativeFull}>
                                        {/* <td>{directory ? "Yes" : "No"}</td> */}
                                        <td>{filePathRelative ? filePathRelative : "/"}</td>
                                        <td>{fileName}</td>
                                        <td><button
                                            hx-confirm={`do you want to remove "${filePathRelativeFull}"?`}
                                            hx-delete={"/upload/delete?file=" + encodeURI(filePathRelativeFull)}
                                            // hx-target={"#" + filePathRelativeFull}
                                            hx-target="#remove-output"
                                            >X</button></td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                    <div id="remove-output"></div>
                </table>
            </>
        );
    });

upload.delete('/delete',
    gitMiddleware,
    validator('query', async (value, c) => {

        const file = value.file;
        if (typeof file === "string") {
            const filePathAbs = path.resolve(c.var.gitDirectory as string, file);
            console.log(`Check if ${filePathAbs} exists`);
            await fsp.access(filePathAbs, fs.constants.R_OK);

            return filePathAbs;
        }

        return undefined;

    }),
    async (c) => {

        const git = c.var.git;
        console.log("GIT=", c.var.git);
        console.log("GIT directory=", c.var.gitDirectory);
        const filePath = c.req.valid('query');
        if (!filePath) {
            throw new Error("No FilePath found");
        }

        await fsp.unlink(filePath);

        await gitRm(git, filePath);
        const diff = await gitDiffNoPager(git);

        if (!diff) {
            return c.html(
                <pre>no data change, nothing to commit</pre>
            );
        }

        const commitMessage = await gitCommit(git, `add ${filePath}`);

        const pushMessage = await gitPush(git, c.var.branchName);

        const logs = await gitLog(git);

        const res = `
DIFF: "${diff}
COMMIT: "${commitMessage}"
PUSH: "${pushMessage}"
LOGS: "${JSON.stringify(logs, null, 4)}"
        `;

        return c.html(
            <>
                <details open>
                    <summary>DONE</summary>
                    <pre>{res}</pre>
                </details>
            </>
        );

        return c.html(<></>);
    });


upload.put('/file',
    gitMiddleware,
    validator('form', (value): [file:File|undefined,filePath:string|undefined] => {

        console.log("[VALIDATOR] value=", value);

        if (value.uploadFile instanceof File && typeof value.filePath === "string") {
            console.log("uploadFile of type File");
            const filePathNormalize = path.resolve("/", path.normalize(value.filePath));
            return [value.uploadFile, filePathNormalize.substring(1)];
        } else {
            console.log("uploadFile not an instance of file: ", typeof value.uploadFile);
        }

        return [undefined, undefined];
    }),
    async (c) => {

        console.log("GIT=", c.var.git);
        console.log("GIT directory=", c.var.gitDirectory);

        const [uploadedFile, filePath] = c.req.valid('form');
        if (!uploadedFile) {
            throw new Error("no file uploaded");
        }
        const relativeFilePath = filePath
            ? path.extname(filePath)
                ? filePath
                : path.join(filePath, uploadedFile.name)
            : uploadedFile.name;
        const absoluteFilePath = path.resolve(c.var.gitDirectory, relativeFilePath);

        const readStream = uploadedFile.stream();

        const dirName = path.dirname(absoluteFilePath);
        if (dirName !== c.var.gitDirectory) {
            await fsp.mkdir(path.dirname(absoluteFilePath), { recursive: true });
        }
        // await fsp.writeFile(absoluteFilePath, §, { encoding: "utf-8"});

        const writeStream = fs.createWriteStream(absoluteFilePath, { encoding: "utf-8", flags: "w" });

        writeStream.on('open', () => {
            console.log("WriteStream open");
        })

        writeStream.on("close", () => {
            console.log("WriteStream close");
        })

        writeStream.on("error", (err) => {
            console.log("WriteStream error:" + String(err));
        });

        await pipeline(
            readStream,
            // async function* (source) {
            //     for await (const chunk of source) {
            //         console.log("DATA:", chunk);
            //         yield chunk.toString();
            //     }
            // },
            writeStream
        );

        writeStream.end();
        writeStream.close();

        return c.html(
            <>
                <details>
                    <summary>Commit INFO:</summary>
                    <p>uploaded: "{uploadedFile.name}" size={Math.round(uploadedFile.size / 1024)}ko type={uploadedFile.type} filePath={absoluteFilePath}</p>
                </details>
                <button hx-post={`/upload/commit?file=${encodeURI(relativeFilePath)}`} hx-target="#output-commit">commit</button>
                <div id="output-commit"></div>
            </>
        )
    });

upload.post('/commit',
    gitMiddleware,
    validator('query', async (value, c) => {

        const file = value.file;
        if (typeof file === "string") {
            const filePathAbs = path.resolve(c.var.gitDirectory as string, file);
            console.log(`Check if ${filePathAbs} exists`);
            await fsp.access(filePathAbs, fs.constants.R_OK);

            return filePathAbs;
        }

        return undefined;

    }),
    async (c) => {

        const git = c.var.git;
        console.log("GIT=", c.var.git);
        console.log("GIT directory=", c.var.gitDirectory);
        const filePath = c.req.valid('query');
        if (!filePath) {
            throw new Error("No FilePath found");
        }

        await gitAdd(git, filePath);
        const diff = await gitDiffNoPager(git);

        if (!diff) {
            return c.html(
                <pre>no data change, nothing to commit</pre>
            );
        }

        const commitMessage = await gitCommit(git, `add ${filePath}`);

        const pushMessage = await gitPush(git, c.var.branchName);

        const logs = await gitLog(git);

        const res = `
DIFF: "${diff}
COMMIT: "${commitMessage}"
PUSH: "${pushMessage}"
LOGS: "${JSON.stringify(logs, null, 4)}"
        `;

        return c.html(
            <>
                <details open>
                    <summary>DONE</summary>
                    <pre>{res}</pre>
                </details>
            </>
        )
    }
);

export default upload;