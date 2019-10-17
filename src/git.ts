import * as core from "@actions/core";
import * as github from "@actions/github";
import {cp, rmRF} from "@actions/io";
import { execute } from "./util";

export async function init() {

  const accessToken = core.getInput("ACCESS_TOKEN");
  const gitHubToken = core.getInput("GITHUB_TOKEN");
  const folder = core.getInput("FOLDER", { required: true });

  const { pusher, repository } = github.context.payload;

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
  // Returns for testing purposes.
  return {
    gitHubRepository: repository ? repository.full_name : "",
    gitHubToken: core.getInput("GITHUB_TOKEN"),
    cname: core.getInput("CNAME"),
    accessToken: core.getInput("ACCESS_TOKEN"),
    branch: core.getInput("BRANCH"),
    baseBranch: 'master',
    folder
  };
}

/*export async function generateBranch(action, repositoryPath) {
  try {
    await execute(`git checkout ${action.baseBranch || "master"}`);
    await execute(`git checkout --orphan ${action.branch}`);
    await execute(`git reset --hard`)
    await execute(`git commit --allow-empty -m "Initial ${action.branch} branch creation"`)
    await execute(`git push ${repositoryPath} ${action.branch}`)
  } catch (error) {
    core.setFailed(`There was an error creating the deployment branch.`);
  } finally {
    console.log("Deployment branch successfully created!");
  }
}*/

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


  const { pusher, repository } = github.context.payload;
  /*const branchExists = await Number(
    execute(`git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`)
  );

  if (!branchExists) {
    await generateBranch(action, repositoryPath);
  }*/


  await execute(`cd ${action.folder}`);
  console.log('Listing directory...')
  console.log('ls', await execute(`ls`))
  await execute(`git init`);
  await execute(`git config user.name ${pusher.name}`);
  await execute(`git config user.email ${pusher.email}`);


  if (action.cname) {
    console.log(`Generating a CNAME file in the ${action.folder} directory...`);
    await execute(`echo ${action.cname} > CNAME`);
  }

  await execute(`git add .`)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch} ${process.env.GITHUB_SHA}"`)
  await execute(`git push origin --force ${repositoryPath} master:gh-pages`)
}
