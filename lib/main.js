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
const child_process_1 = require("child_process");
function execute(cmd) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            child_process_1.exec(cmd, (error, stdout) => {
                resolve(stdout.trim());
            });
        });
    });
}
exports.execute = execute;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const { pusher, repository } = github.context.payload;
        const accessToken = core.getInput('ACCESS_TOKEN');
        const gitHubToken = core.getInput('GITHUB_TOKEN');
        const folder = core.getInput('FOLDER', { required: true });
        if (!accessToken && !gitHubToken) {
            core.setFailed('You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy.');
        }
        if (folder.startsWith('/') || folder.startsWith('./')) {
            core.setFailed(`The deployment folder cannot be prefixed with '/' or './'. Instead reference the folder name directly.`);
        }
        yield execute(`cd ${process.env.GITHUB_WORKSPACE}`);
        yield execute(`git init`);
        yield execute(`git config user.name ${pusher.name}`);
        yield execute(`git config user.email ${pusher.email}`);
        // Returns for testing purposes.
        return {
            gitHubRepository: repository ? repository.full_name : '',
            gitHubToken: core.getInput('GITHUB_TOKEN'),
            cname: core.getInput('CNAME'),
            accessToken: core.getInput('ACCESS_TOKEN'),
            branch: core.getInput('BRANCH'),
            baseBranch: core.getInput('BASE_BRANCH'),
            folder,
        };
    });
}
function deploy(action) {
    return __awaiter(this, void 0, void 0, function* () {
        const repositoryPath = `https://${action.accessToken || `x-access-token:${action.gitHubToken}`}@github.com/${action.gitHubRepository}.git`;
        yield execute(`git checkout ${action.baseBranch || 'master'}`);
        if (action.cname) {
            console.log(`Generating a CNAME file in the ${action.folder} directory...`);
            yield execute(`echo ${action.cname} > ${action.folder}/CNAME`);
        }
        // Checks to see if the deployment branch exists, if not it needs to be created.
        const branchExists = yield execute(`git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`);
        if (!branchExists) {
            console.log('Deploying new branch');
        }
        yield execute(`git add -f ${action.folder}`);
        yield execute(`git commit -m "Deploying to ${action.branch} from ${action.baseBranch || 'master'} ${process.env.GITHUB_SHA}"`);
        yield execute(`git push ${repositoryPath} \`git subtree split --prefix ${action.folder} ${action.baseBranch || 'master'}\`:${action.branch} --force`);
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
        finally {
            console.log('Deployment Successful');
        }
    });
}
run();
