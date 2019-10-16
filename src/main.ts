import * as core from '@actions/core';
import * as github from '@actions/github';
import {exec} from 'child_process';


export async function execute(cmd: string):Promise<String> {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout) => {
      resolve(stdout.trim());
    });
  })
}

async function init() {
  const {pusher, repository} = github.context.payload;

  const gitHubRepository = repository ? repository.full_name : '';
  const accessToken = core.getInput('ACCESS_TOKEN');
  const gitHubToken = core.getInput('GITHUB_TOKEN');
  const baseBranch = core.getInput('BASE_BRANCH');
  const branch = core.getInput('BRANCH');
  const folder = core.getInput('FOLDER');
  const cname = core.getInput('CNAME')

  if (!accessToken && !gitHubToken) {
    core.setFailed('You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.')
  }

  if (!branch) {
    core.setFailed('You must provide the action with a branch name it should deploy to, for example gh-pages or docs.')
  }

  if (!folder) {
    core.setFailed('You must provide the action with the folder name in the repository where your compiled page lives.')
  }

  await execute(`cd ${process.env.GITHUB_WORKSPACE}`)
  await execute(`git init`)
  await execute(`git config user.name ${pusher.name}`)
  await execute(`git config user.email ${pusher.email}`)

  // Returns for testing purposes.
  return Promise.resolve({
    gitHubToken,
    gitHubRepository,
    cname,
    accessToken,
    branch,
    baseBranch,
    folder,
  });
}

async function deploy(action) {
  const repositoryPath = `https://${action.accessToken || `x-access-token:${action.gitHubToken}`}@github.com/${action.gitHubRepository}.git`
  
  await execute(`git checkout ${action.baseBranch || 'master'}`)
  await execute(`git add -f ${action.folder}`)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`)
  await execute(`git push ${repositoryPath} \`git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}\`:${action.branch} --force`)

  if (action.cname) {
    console.log(`Generating a CNAME file in the ${action.folder} directory...`)
    await execute (`${action.cname} > ${action.folder}/CNAME`)
  }

  console.log('Deployment Successful!')
}


async function run() {
  try {
    // Initializes the action.
    const action = await init();

    await deploy(action)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
