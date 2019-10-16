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

  const accessToken = core.getInput('ACCESS_TOKEN');
  const gitHubToken = core.getInput('GITHUB_TOKEN');
  const folder = core.getInput('FOLDER', {required: true});

  if (!accessToken && !gitHubToken) {
    core.setFailed('You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.')
  }


  await execute(`cd ${process.env.GITHUB_WORKSPACE}`)
  await execute(`git init`)
  await execute(`git config user.name ${pusher.name}`)
  await execute(`git config user.email ${pusher.email}`)

  // Returns for testing purposes.
  return {
    gitHubToken: core.getInput('GITHUB_TOKEN'),
    gitHubRepository: repository ? repository.full_name : '',
    cname: core.getInput('CNAME'),
    accessToken: core.getInput('ACCESS_TOKEN'),
    branch: core.getInput('BRANCH'),
    baseBranch: core.getInput('BASE_BRANCH'),
    folder,
  };
}

async function deploy(action) {
  const repositoryPath = `https://${action.accessToken || `x-access-token:${action.gitHubToken}`}@github.com/${action.gitHubRepository}.git`

  await execute(`git checkout ${action.baseBranch || 'master'}`)

  if (action.cname) {
    console.log(`Generating a CNAME file in the ${action.folder} directory...`)
    await execute (`echo ${action.cname} > ${action.folder}/CNAME`)
  }

  await execute(`git add -f ${action.folder}`)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`)
  await execute(`git push ${repositoryPath} \`git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}\`:${action.branch} --force`)
}


async function run() {
  try {
    // Initializes the action.
    const action = await init();
    await deploy(action);
  } catch (error) {
    core.setFailed(error.message);
  } finally {
    console.log('Deployment Successful')
  }
}

run();
