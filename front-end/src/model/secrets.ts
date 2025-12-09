
export interface ISecrets {
  users: {
    id: number;
    group: string;
    profile: string;
    username: string;
    password: string;
  }[];
  key: string;
};

const secretsEncoded = process.env.__SECRETS_ENCODED;

if (!secretsEncoded) {
    throw new Error(`ENV VAR SECRETS Not FOUND!!`);
}

const secretsString = Buffer.from(secretsEncoded, "base64").toString("utf8");
const secretsJson = JSON.parse(secretsString) as ISecrets;

if (!(typeof secretsJson.key === "string" && Array.isArray(secretsJson.users))) {
    throw new Error("ENV VAR SECRETS does not have key or users value");
}

export const secrets = secretsJson;