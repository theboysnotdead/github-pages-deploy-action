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
const exec_1 = require("@actions/exec");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const { pusher, repository } = github.context.payload;
        const accessToken = core.getInput('ACCESS_TOKEN');
        const githubToken = core.getInput('GITHUB_TOKEN');
        const baseBranch = core.getInput('BASE_BRANCH');
        const branch = core.getInput('BRANCH');
        const folder = core.getInput('FOLDER');
        if (!accessToken && !githubToken) {
            core.setFailed('You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.');
        }
        if (!branch) {
            core.setFailed('You must provide the action with a branch name it should deploy to, for example gh-pages or docs.');
        }
        if (!folder) {
            core.setFailed('You must provide the action with the folder name in the repository where your compiled page lives.');
        }
        const gitHubEvent = require(`${process.env.GITHUB_EVENT_PATH}`);
        let commitEmail = gitHubEvent.pusher.email || null;
        let commitName = gitHubEvent.pusher.name || null;
        if (!commitEmail) {
            commitEmail = process.env.GITHUB_ACTOR || 'github-pages-deploy-action';
        }
        if (!commitName) {
            commitName = process.env.GITHUB_ACTOR || 'Github Pages Deploy Action';
        }
        yield exec_1.exec('git init');
        yield exec_1.exec(`git config user.name ${pusher.name}`);
        yield exec_1.exec(`git config user.email ${pusher.email}`);
        const githubRepository = repository ? repository.name : '';
        // Returns for testing purposes.
        return Promise.resolve({
            githubRepository,
            commitName,
            commitEmail,
            accessToken,
            githubToken,
            branch,
            baseBranch,
            folder,
        });
    });
}
function createBranch() {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
function deploy(action) {
    return __awaiter(this, void 0, void 0, function* () {
        const repositoryPath = `https://${action.accessToken || `x-access-token:${action.githubToken}`}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
        const gitStatus = yield exec_1.exec(`git status --porcelain`);
        yield exec_1.exec(`cd ${action.folder}`);
        if (gitStatus) {
            console.log('There is currently nothing to deploy, aborting...');
            return;
        }
        yield exec_1.exec(`git add .`);
        yield exec_1.exec(`git commit -m "Deploying to GitHub Pages"`);
        yield exec_1.exec(`git push --force ${repositoryPath} ${action.baseBranch ? action.baseBranch : 'master'}:${action.branch}`);
        //await exec(`git checkout ${action.baseBranch || 'master'}`)
        //await exec(`git add -f ${action.folder}`)
        //await exec(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`)
        //await exec(`git push $REPOSITORY_PATH 'git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}':${action.baseBranch} --force`)
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initializes the action.
            const action = yield init();
            yield deploy(action);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
