import { http } from '@google-cloud/functions-framework';
// const {ArtifactRegistryClient} = require('@google-cloud/artifact-registry').v1;
import * as artifact from "@google-cloud/artifact-registry";
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
  let redirectLocation = "https://artifactregistry.googleapis.com/download/v1/projects/PROJECT/locations/LOCATION/repositories/REPOSITORY/files/FILE:download?alt=media";

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
            const fileMatch = fileIdentifierRaw.match(/([^:]+):([^:]+):(.+)/);
            if (fileMatch) {

              const result: IArtifact = {
                project: typeof match[1] === "string" ? match[1] : "",
                location: typeof match[2] === "string" ? match[2] : "",
                repository: typeof match[3] === "string" ? match[3] : "",
                fileIdentifierRaw: fileIdentifierRaw,
                file: {
                  filename: typeof fileMatch[1] === "string" ? fileMatch[1]: "",
                  version: typeof fileMatch[2] === "number" ? (new Date(fileMatch[2] as string)).getTime() : 0,
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
    await callListFiles();

    if (artifactLatest && artifactLatest.project && artifactLatest.location && artifactLatest.repository && artifactLatest.fileIdentifierRaw && artifactLatest.file?.version) {
      res.setHeader("ETag", artifactLatest.file.version);

      const IfNoneMatchVersion = req.header("If-None-Match")?.replaceAll("\"", "");
      console.log("IfNoneMatchVersion=", IfNoneMatchVersion);
      const IfNoneMatchVersionTimestamp = IfNoneMatchVersion ? (new Date(IfNoneMatchVersion)).getTime() : undefined; // undefined or NaN returns by newDate
      console.log("IfNoneMatchVersionConvertedTimestamp=", IfNoneMatchVersionTimestamp)
      if (IfNoneMatchVersionTimestamp && IfNoneMatchVersionTimestamp === artifactLatest.file.version) {
        res.statusCode = 304;
        console.log("IfNotMatch failed, send status 304 not modified");
      } else {
        console.log("IfNotMatch success, redirect (302) to the latest artifact release");
        redirectLocation = redirectLocation.replace("PROJECT", artifactLatest.project);
        redirectLocation = redirectLocation.replace("LOCATION", artifactLatest.location);
        redirectLocation = redirectLocation.replace("REPOSITORY", artifactLatest.repository);
        redirectLocation = redirectLocation.replace("FILE", encodeURIComponent(artifactLatest.fileIdentifierRaw));
        res.statusCode = 302;
        res.location(redirectLocation);
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
    res.send();
  }

});
