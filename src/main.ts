import * as core from '@actions/core';
import {init, deploy} from './git';

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

// TODO: This should probably be an anon function
run();
