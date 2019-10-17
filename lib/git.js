"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const util_1 = require("./util");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const { pusher, repository } = github.context.payload;
        const accessToken = core.getInput("ACCESS_TOKEN");
        const gitHubToken = core.getInput("GITHUB_TOKEN");
        const folder = core.getInput("FOLDER", { required: true });
        if (!accessToken && !gitHubToken) {
            core.setFailed("You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.");
        }
        if (folder.startsWith("/") || folder.startsWith("./")) {
            core.setFailed(`The deployment folder cannot be prefixed with '/' or './'. Instead reference the folder name directly.`);
        }
        yield util_1.execute(`git init`);
        yield util_1.execute(`git config user.name ${pusher.name}`);
        yield util_1.execute(`git config user.email ${pusher.email}`);
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
    });
}
exports.init = init;
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
function deploy(action) {
    return __awaiter(this, void 0, void 0, function* () {
        const repositoryPath = `https://${action.accessToken ||
            `x-access-token:${action.gitHubToken}`}@github.com/${action.gitHubRepository}.git`;
        /*const branchExists = await Number(
          execute(`git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`)
        );
      
        if (!branchExists) {
          await generateBranch(action, repositoryPath);
        }*/
        if (action.cname) {
            console.log(`Generating a CNAME file in the ${action.folder} directory...`);
            yield util_1.execute(`echo ${action.cname} > CNAME`);
        }
        yield util_1.execute(`git add .`);
        yield util_1.execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch} ${process.env.GITHUB_SHA}"`);
        yield util_1.execute(`git push --force ${repositoryPath} ${action.baseBranch}:${action.branch}`);
    });
}
exports.deploy = deploy;
