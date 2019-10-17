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
const child_process_1 = require("child_process");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const repoToken = core.getInput("ACCESS_TOKEN", { required: true });
const siteDirectory = core.getInput("FOLDER", { required: true });
const { pusher, repository } = github.context.payload;
const deployBranch = "gh-pages";
const repo = (repository && repository.name) || "";
const gitUrl = `https://${repoToken}@github.com/${repo}.git`;
function execPromise(command) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield execPromise(`cd ${siteDirectory}`);
        yield execPromise("git init");
        yield execPromise(`git config user.name ${pusher.name}`);
        yield execPromise(`git config user.email ${pusher.email}`);
        const gitStatus = yield execPromise(`git status --porcelain`);
        if (gitStatus) {
            console.log("Nothing to deploy");
            return;
        }
        yield execPromise("git add .");
        yield execPromise('git commit -m "Deploy to GitHub Pages"');
        yield execPromise(`git push --force ${gitUrl} master:${deployBranch}`);
        console.log(`✅ Successfully deployed to GitHub pages. The ${siteDirectory} directory has been pushed to ${deployBranch} branch`);
    }
    catch (error) {
        core.error(error);
        core.setFailed(`❌ Failed to deploy to GitHub pages: ${siteDirectory} directory failed to push to ${deployBranch} branch\n${error}`);
    }
}))();
