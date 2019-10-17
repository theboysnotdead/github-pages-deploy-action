import * as core from "@actions/core";

export const workspace: any = process.env.GITHUB_WORKSPACE
export const build = core.getInput("FOLDER", { required: true });