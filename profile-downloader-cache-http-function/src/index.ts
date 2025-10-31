import { http } from '@google-cloud/functions-framework';
// const {ArtifactRegistryClient} = require('@google-cloud/artifact-registry').v1;
import * as artifact from "@google-cloud/artifact-registry";
import * as semver from "semver";
const { ArtifactRegistryClient } = artifact.v1;
interface IArtifact {
  project: string | undefined;
  location: string | undefined;
  repository: string | undefined;
  fileIdentifierRaw: string | undefined;
  file: {
    filename: string | undefined;
    version: string | undefined;
    artifact: string | undefined;
  } | undefined;
};

http('profile-downloader-cache-http-function', async (req, res) => {

  console.log("Artifact registry Connection");
  const artifactregistryClient = new ArtifactRegistryClient();

  let artifactLatest: IArtifact | undefined;
  let redirectLocation = "https://artifactregistry.googleapis.com/download/v1/projects/PROJECT/locations/LOCATION/repositories/REPOSITORY/files/FILE:download?alt=media";

  async function callListFiles() {
    // Construct request
    const request = {
      // parent: "projects/customization-profile/locations/europe-west1/repositories/customization-profile-demo",
      parent: process.env.GCP_ARTIFACT_PARENT || "projects/customization-profile/locations/europe-west1/repositories/customization-profile-demo"
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
          const result: IArtifact = {
            project: match[1],
            location: match[2],
            repository: match[3],
            fileIdentifierRaw: fileIdentifierRaw,
            file: undefined,
          };

          if (fileIdentifierRaw) {
            const fileMatch = fileIdentifierRaw.match(/([^:]+):([^:]+):(.+)/);

            if (fileMatch) {

              result.file = {
                filename: fileMatch[1],
                version: fileMatch[2],
                artifact: fileMatch[3],
              }
            } else {
              console.error("fileIdentifier match not found", fileIdentifierRaw);
            }
          } else {
            console.error("NoFileIdentifierFound from the artifactName", name);
          }
          console.log("ArtifactNameParsingResutl=", JSON.stringify(result));

          // if (!artifactLatest || (result.file?.version && semver.gt(artifactLatest.file?.version as string, result.file?.version))) { // test purpose only reverse of the below greater than
          if (!artifactLatest || (result.file?.version && semver.gt(result.file?.version, artifactLatest.file?.version as string))) {
            artifactLatest = result;
            console.log(`Set (${fileIdentifierRaw}) as the latest artifact`);
          } else {
            console.log("not a valid or latest artifiact file=", fileIdentifierRaw);
          }
        } else {
          console.error("name parsing error name=", name);
        }


      }
    }
  }

  await callListFiles();

  if (artifactLatest && artifactLatest.project && artifactLatest.location && artifactLatest.repository && artifactLatest.fileIdentifierRaw && artifactLatest.file?.version) {
    res.setHeader("ETag", artifactLatest.file.version);

    const IfNoneMatchVersion = req.header("If-None-Match")?.replaceAll("\"", "");
    console.log("IfNoneMatchVersion=", IfNoneMatchVersion);
    if (IfNoneMatchVersion && /^(\d+)\.(\d+)\.(\d+)$/.test(IfNoneMatchVersion) && IfNoneMatchVersion === artifactLatest.file.version) {
      res.statusCode = 304;
      console.log("IfNotMatch failed, so let's send status 304 not modified");
    } else {
      console.log("IfNotMatch success, so let's redirect (302) to the latest release");
      redirectLocation = redirectLocation.replace("PROJECT", artifactLatest.project);
      redirectLocation = redirectLocation.replace("LOCATION", artifactLatest.location);
      redirectLocation = redirectLocation.replace("REPOSITORY", artifactLatest.repository);
      redirectLocation = redirectLocation.replace("FILE", encodeURIComponent(artifactLatest.fileIdentifierRaw));
      res.statusCode = 302;
      res.location(redirectLocation);
    }

  } else {

    console.error("latest artifact not defined, so let's set status code to 500");
    res.statusCode = 500;
  }

  console.log("SEND Header :", res.statusCode, JSON.stringify(res.getHeaders(), null, 4));
  res.send();
});
