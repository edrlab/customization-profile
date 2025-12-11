import { http } from '@google-cloud/functions-framework';
import * as artifact from "@google-cloud/artifact-registry";
import { GoogleAuth } from "google-auth-library"
import { Readable } from "stream"
import { ReadableStream } from 'node:stream/web'

const { ArtifactRegistryClient } = artifact.v1;
interface IArtifact {
  project: string;
  location: string;
  repository: string;
  fileIdentifierRaw: string;
  file: {
    filename?: string;
    version: number;
    artifact?: string;
  };
};

http('profile-downloader-cache-http-function', async (req, res) => {

  const requestPath = req.path;
  console.log("function request path=", requestPath);

  let stream = false;

  const repositories = requestPath.replaceAll("/", "").replaceAll("\\", "").trim();
  if (!repositories) {
    console.error("No repositories found in request path, send error 404", repositories);
    res.statusCode = 404;
    res.send();
    return ;
  }
  const artifactRequestParent = (process.env.GCP_ARTIFACT_PARENT || "projects/customization-profile/locations/europe-west1/repositories/REPOSITORIES").replace("REPOSITORIES", repositories);
  console.log("Set artifact request parent to", artifactRequestParent);

  console.log("Artifact registry Connection");
  const artifactregistryClient = new ArtifactRegistryClient();

  let artifactLatest: IArtifact | undefined;
  let artifactRegistryProfileUrl = "https://artifactregistry.googleapis.com/download/v1/projects/PROJECT/locations/LOCATION/repositories/REPOSITORY/files/FILE:download?alt=media";

  async function callListFiles() {
    // Construct request
    const request = {
      // parent: "projects/customization-profile/locations/europe-west1/repositories/customization-profile-demo",
      parent: artifactRequestParent,
    };

    // Run request
    console.log("ArtifactRegistryClient List file from", request.parent);
    
    const iterable = artifactregistryClient.listFilesAsync(request);
    for await (const response of iterable) {
      // console.log(response);

      const name = response.name;
      if (name) {
        // projects/customization-profile/locations/europe-west1/repositories/customization-profile-demo/files/custom-profile.thorium:1.0.0:thorium-university-press-1-0-0.thorium
        console.log("ArtifactName=", name);

        const regex = /^projects\/([^/]+)\/locations\/([^/]+)\/repositories\/([^/]+)\/files\/([^/]+)$/;

        const match = name.match(regex);

        if (match) {
          const fileIdentifierRaw = match[4];
          if (fileIdentifierRaw) {
            const fileMatch = fileIdentifierRaw.match(/^(.*?):(.*):([^:]*)$/);
            if (fileMatch) {

              const result: IArtifact = {
                project: typeof match[1] === "string" ? match[1] : "",
                location: typeof match[2] === "string" ? match[2] : "",
                repository: typeof match[3] === "string" ? match[3] : "",
                fileIdentifierRaw: fileIdentifierRaw,
                file: {
                  filename: typeof fileMatch[1] === "string" ? fileMatch[1]: "",
                  version: typeof fileMatch[2] === "string" ? (new Date(fileMatch[2] as string)).getTime() : 0,
                  artifact: typeof fileMatch[3] === "string" ? fileMatch[3] : "",
                }
              }

              console.log("ArtifactNameParsingResutl=", JSON.stringify(result));
              if (!artifactLatest || result.file.version > artifactLatest.file.version) {
                artifactLatest = result;
                console.log(`Set (${fileIdentifierRaw}) as the latest artifact`);
              } else {
                console.log("not a valid or latest artifiact file=", fileIdentifierRaw);
              }
            } else {
              console.error("fileIdentifier match not found", fileIdentifierRaw);
            }
          } else {
            console.error("NoFileIdentifierFound from the artifactName", name);
          }
        } else {
          console.error("name parsing error name=", name);
        }
      }
    }
  }

  try {

    try {
      await callListFiles();
    } catch (e) {
      res.statusCode = 404;
      console.error("Error to fetch artifact registry profile", e);
    }

    if (artifactLatest && artifactLatest.project && artifactLatest.location && artifactLatest.repository && artifactLatest.fileIdentifierRaw && artifactLatest.file?.version) {
      res.setHeader("ETag", (new Date(artifactLatest.file.version)).toISOString());

      const IfNoneMatchVersion = req.header("If-None-Match")?.replaceAll("\"", "");
      console.log("IfNoneMatchVersion=", IfNoneMatchVersion);
      const IfNoneMatchVersionTimestamp = IfNoneMatchVersion ? (new Date(IfNoneMatchVersion)).getTime() : undefined; // undefined or NaN returns by newDate
      console.log("IfNoneMatchVersionConvertedTimestamp=", IfNoneMatchVersionTimestamp)
      if (IfNoneMatchVersionTimestamp && IfNoneMatchVersionTimestamp === artifactLatest.file.version) {
        res.statusCode = 304;
        console.log("IfNotMatch failed, send status 304 not modified");
      } else {
        console.log("IfNotMatch success, stream latest artifact release");
        artifactRegistryProfileUrl = artifactRegistryProfileUrl.replace("PROJECT", artifactLatest.project);
        artifactRegistryProfileUrl = artifactRegistryProfileUrl.replace("LOCATION", artifactLatest.location);
        artifactRegistryProfileUrl = artifactRegistryProfileUrl.replace("REPOSITORY", artifactLatest.repository);
        artifactRegistryProfileUrl = artifactRegistryProfileUrl.replace("FILE", encodeURIComponent(artifactLatest.fileIdentifierRaw));

        const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" })
        const client = await auth.getClient()
        const token = await client.getAccessToken()

        if (!token?.token) {
          throw new Error("Google Cloud Platform token not found");
        }

        const headers: Record<string, string> = {};
        if (req.headers.range) headers.Range = req.headers.range;
        headers.Authorization = `Bearer ${token?.token}`;

        const upstream = await fetch(artifactRegistryProfileUrl, { headers });
        console.log("UPSTREAM Headers", upstream.headers);
        if (upstream.status !== 200) {
          console.error("latest artifact release request receive with status code not 200 code=", upstream.status, upstream.statusText);
          res.statusCode = 404;

        } else {
          console.log("artifact registry download profile Headers=", JSON.stringify(upstream.headers));

          if (upstream.body) {
            res.statusCode = 200;
            res.setHeader("content-type", "application/vnd.edrlab.thorium+zip");
            if (upstream.headers.get("accept-ranges") === "bytes") {
              res.setHeader("accept-ranges", "bytes");
            } else {
              console.log("Artifact registry download server has not byte range compatibiliy");
            }
            const contentLength = upstream.headers.get("content-length");
            if (contentLength) {
              res.setHeader("content-length", contentLength);
            } else {
              console.log("Artifact registry download server returns no content-length ! why!?");
            }

            stream = true;
            Readable.fromWeb(upstream.body as ReadableStream<any>).pipe(res);
          } else {
            console.error("NO upstream body !");
            res.statusCode = 404;
          }
        }

      }

    } else {
      console.error("latest artifact release not found, send error 404");
      res.statusCode = 404;
    }
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
  } finally {
    console.log("SEND Header :", res.statusCode, JSON.stringify(res.getHeaders(), null, 4));
    if (!stream) {
      res.send();
    }
  }

});
