import type { AnyJson } from "../manifest.js";


export const fetchAllGithubActionRuns = async (token: string) => {
    const runsRequest = await fetch(
        `https://api.github.com/repos/panac/customization-profile-data/actions/runs`,
        {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `Bearer ${token}`,
                "X-GitHub-Api-Version": "2022-11-28",
            },
            signal: AbortSignal.timeout(5000),
        }
    );

    if (!runsRequest.ok) {
        throw new Error(`status:${runsRequest.status} error:${runsRequest.statusText}`);
    }

    console.log("runRequest", runsRequest);

    const runsJsonData = await runsRequest.json() as AnyJson;
    return runsJsonData
}

export const getGithubActionRunStatus = (actionsRunsData: any, commitHashId: string) => {

    // eslint-disable-next-line
    const run = actionsRunsData.workflow_runs.find(({head_commit: {id}}: any) => id === commitHashId);
    console.log("GithubAction run:", run);

    return {
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        created_at: run.created_at,
        updated_at: run.updated_at,
    };
}