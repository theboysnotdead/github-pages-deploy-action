import * as core from "@actions/core";
import * as github from "@actions/github";
import { execute } from "./util";

export async function init() {
  const { pusher, repository } = github.context.payload;

  const accessToken = core.getInput("ACCESS_TOKEN");
  const gitHubToken = core.getInput("GITHUB_TOKEN");
  const folder = core.getInput("FOLDER", { required: true });

  if (!accessToken && !gitHubToken) {
    core.setFailed(
      "You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy."
    );
  }

  if (folder.startsWith("/") || folder.startsWith("./")) {
    core.setFailed(
      `The deployment folder cannot be prefixed with '/' or './'. Instead reference the folder name directly.`
    );
  }

  await execute(`cd ${process.env.GITHUB_WORKSPACE}`);
  await execute(`git init`);
  await execute(`git config user.name ${pusher.name}`);
  await execute(`git config user.email ${pusher.email}`);

  // Returns for testing purposes.
  return {
    gitHubRepository: repository ? repository.full_name : "",
    gitHubToken: core.getInput("GITHUB_TOKEN"),
    cname: core.getInput("CNAME"),
    accessToken: core.getInput("ACCESS_TOKEN"),
    branch: core.getInput("BRANCH"),
    baseBranch: core.getInput("BASE_BRANCH"),
    folder
  };
}

export async function generateBranch() {}

export async function deploy(action: {
  gitHubRepository: any;
  gitHubToken: any;
  cname: any;
  accessToken: any;
  branch: any;
  baseBranch: any;
  folder: any;
}) {
  const repositoryPath = `https://${action.accessToken ||
    `x-access-token:${action.gitHubToken}`}@github.com/${
    action.gitHubRepository
  }.git`;

  await execute(`git checkout ${action.baseBranch || "master"}`);

  if (action.cname) {
    console.log(`Generating a CNAME file in the ${action.folder} directory...`);
    await execute(`echo ${action.cname} > ${action.folder}/CNAME`);
  }

  // TODO: Checks to see if the deployment branch exists, if not it needs to be created.
  const branchExists = await Number(execute(
    `git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`
  ));

  if (!branchExists) {
    console.log("Deploying new branch");
  }

  await execute(`git add -f ${action.folder}`);
  await execute(
    `git commit -m "Deploying to ${action.branch} from ${action.baseBranch ||
      "master"} ${process.env.GITHUB_SHA}"`
  );
  await execute(
    `git push ${repositoryPath} \`git subtree split --prefix ${
      action.folder
    } ${action.baseBranch || "master"}\`:${action.branch} --force`
  );
}
