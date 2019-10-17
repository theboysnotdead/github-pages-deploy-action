import * as core from "@actions/core";
import * as github from "@actions/github";
import {cp, rmRF} from "@actions/io";
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
  await execute(`cd ${folder}`);
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
    buildScript: core.getInput("BUILD_SCRIPT"),
    folder
  };
}

export async function generateBranch(action, repositoryPath) {
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
}

export async function deploy(action: {
  gitHubRepository: any;
  gitHubToken: any;
  cname: any;
  accessToken: any;
  branch: any;
  baseBranch: any;
  folder: any;
  buildScript: any;
}) {
  const temporaryDeploymentDirectory = 'tmp-deployment-folder';
  const temporaryDeploymentBranch = 'tmp-deployment-branch';

  const repositoryPath = `https://${action.accessToken ||
    `x-access-token:${action.gitHubToken}`}@github.com/${
    action.gitHubRepository
  }.git`;

  /*const branchExists = await Number(
    execute(`git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`)
  );

  if (!branchExists) {
    await generateBranch(action, repositoryPath);
  }*/


  // TODO: New?

  if (action.cname) {
    console.log(`Generating a CNAME file in the ${action.folder} directory...`);
    await execute(`echo ${action.cname} > CNAME`);
  }

  await execute(`git add .`)
  await execute(`git push --force ${repositoryPath} ${action.baseBranch}:${action.branch}`)
  await rmRF('.git')

  /*
  await execute(`git checkout ${action.baseBranch || 'master'}`)

  console.log('Building')

  await execute(`eval ${action.buildScript}`)

  await execute(`git fetch origin`)

  await rmRF(temporaryDeploymentDirectory)

  console.log('Preparing for deployment....')

  await execute(`git worktree add --checkout ${temporaryDeploymentDirectory} origin/${action.branch}`)

  await cp(`${action.folder}/*`, temporaryDeploymentDirectory, {recursive: true, force: true})
  //await execute(`cp -rf ${action.folder}/* ${temporaryDeploymentDirectory}`)
  await execute(`cd ${temporaryDeploymentDirectory}`)

  console.log('Preparing Git Commit...')
  await execute(`git add --all .`)
  await execute(`git checkout -b ${temporaryDeploymentBranch}`)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`)
  
  console.log('Executing push to GitHub')
  await execute(`git push ${repositoryPath} ${temporaryDeploymentBranch}:${action.branch}`)
*/
}
