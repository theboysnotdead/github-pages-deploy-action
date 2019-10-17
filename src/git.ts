import * as core from "@actions/core";
import * as github from "@actions/github";
import {cp, rmRF} from "@actions/io"
import { execute } from "./util";
import { workspace, build } from './constants';

export async function init() {
  const { pusher, repository } = github.context.payload;

  const accessToken = core.getInput("ACCESS_TOKEN");
  const gitHubToken = core.getInput("GITHUB_TOKEN");

  if (!accessToken && !gitHubToken) {
    core.setFailed(
      "You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy."
    );
  }

  if (build.startsWith("/") || build.startsWith("./")) {
    core.setFailed(
      `The deployment folder cannot be prefixed with '/' or './'. Instead reference the folder name directly.`
    );
  }

  await execute(`git init`, workspace);
  await execute(`git config user.name ${pusher.name}`, workspace);
  await execute(`git config user.email ${pusher.email}`, workspace);

  // Returns for testing purposes.
  return {
    gitHubRepository: repository ? repository.full_name : "",
    gitHubToken: core.getInput("GITHUB_TOKEN"),
    cname: core.getInput("CNAME"),
    accessToken: core.getInput("ACCESS_TOKEN"),
    branch: core.getInput("BRANCH"),
    baseBranch: core.getInput("BASE_BRANCH"),
    
  };
}

export async function generateBranch(action, repositoryPath) {
  try {
    await execute(`git checkout ${action.baseBranch || "master"}`, workspace);
    await execute(`git checkout --orphan ${action.branch}`, workspace);
    await execute(`git reset --hard`, workspace)
    await execute(`git commit --allow-empty -m "Initial ${action.branch} branch creation"`, workspace)
    await execute(`git push ${repositoryPath} ${action.branch}`, workspace)
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
}) {
  const temporaryDeploymentDirectory = 'tmp-deployment-folder';
  const temporaryDeploymentBranch = 'tmp-deployment-branch';

  const repositoryPath = `https://${action.accessToken ||
    `x-access-token:${action.gitHubToken}`}@github.com/${
    action.gitHubRepository
  }.git`;

  const branchExists = await Number(
    execute(`git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`, workspace)
  );

  if (!branchExists) {
    await generateBranch(action, repositoryPath);
  }

  await execute(`git checkout ${action.baseBranch || 'master'}`, workspace)

  if (action.cname) {
    console.log(`Generating a CNAME file in the ${build} directory...`);
    await execute(`echo ${action.cname} > CNAME`, build);
  }

  await execute(`git fetch origin`, workspace)

  console.log('Preparing for deployment....')
  await rmRF(temporaryDeploymentDirectory)
  await execute(`rm -rf ${temporaryDeploymentDirectory}`, workspace)
  await execute(`git worktree add --checkout ${temporaryDeploymentDirectory} origin/${action.branch}`, workspace)
  await cp(`${build}/*`, temporaryDeploymentDirectory, {recursive: true, force: true})

  console.log('Preparing Git Commit...')
  await execute(`git add --all .`, temporaryDeploymentDirectory)
  await execute(`git checkout -b ${temporaryDeploymentBranch}`, temporaryDeploymentDirectory)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`, temporaryDeploymentDirectory)
  
  console.log('Executing push to GitHub')
  await execute(`git push ${repositoryPath} ${temporaryDeploymentBranch}:${action.branch}`, temporaryDeploymentDirectory)

}
