import * as core from '@actions/core';
import * as github from '@actions/github';
import {exec} from '@actions/exec';


/** Executes on the command line.
 * @returns {Promise} - Returns a promise with the output once executed.
 */
export async function execute(command: string): Promise<any> {
	return await exec(command, [], {
      cwd: process.env.GITHUB_WORKSPACE,
    },
  )
}

/** Initializes the Git repository.
 * @returns {Promise} - Returns a promise with all of the repository information.
*/
async function init(): Promise<object> {
  const {pusher, repository} = github.context.payload;
  const gitHubRepository = repository ? repository.full_name : '';
  const accessToken = core.getInput('ACCESS_TOKEN');
  const gitHubToken = core.getInput('GITHUB_TOKEN');
  const baseBranch = core.getInput('BASE_BRANCH');
  const branch = core.getInput('BRANCH');
  const folder = core.getInput('FOLDER');

  if (!accessToken && !gitHubToken) {
    core.setFailed('You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.')
  }

  if (!branch) {
    core.setFailed('You must provide the action with a branch name it should deploy to, for example gh-pages or docs.')
  }

  if (!folder) {
    core.setFailed('You must provide the action with the folder name in the repository where your compiled page lives.')
  }

  //await execute(`cd ${process.env.GITHUB_WORKSPACE}`)
  await execute(`git init`)
  await execute(`git config user.name ${pusher.name}`)
  await execute(`git config user.email ${pusher.email}`)

  // Returns for testing purposes.
  return Promise.resolve({
    gitHubToken,
    gitHubRepository,
    accessToken,
    branch,
    baseBranch,
    folder,
  });
}

/** Hanles the action deployment. */
async function deploy(action) {
  const repositoryPath = `https://${action.accessToken || `x-access-token:${action.gitHubToken}`}@github.com/${action.gitHubRepository}.git`
  
  await execute(`git checkout ${action.baseBranch || 'master'}`)
  await execute(`git add -f ${action.folder}`)
  await execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`)
  await execute(`git push ${repositoryPath} \`git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}\`:${action.branch} --force`)
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
