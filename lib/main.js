"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
function init() {
    return __awaiter(this, void 0, void 0, function* () {
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
        // Returns for testing purposes.
        return Promise.resolve({
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
        yield exec_1.default.exec(`git checkout ${action.baseBranch || 'master'}`);
        yield exec_1.default.exec(`git add -f ${action.folder}`);
        yield exec_1.default.exec(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`);
        yield exec_1.default.exec(`git push $REPOSITORY_PATH 'git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}':${action.baseBranch} --force`);
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
