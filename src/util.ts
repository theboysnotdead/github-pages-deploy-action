import { exec } from "@actions/exec";
import { rejects } from "assert";

export async function execute(cmd: string): Promise<String> {
  return new Promise((resolve, reject) => {
    exec(cmd, [], {
      cwd: `${process.env.GITHUB_WORKSPACE}/build`,
      listeners: {
        stdout: (data: Buffer) => {
          resolve(data.toString());
        },
        stderr: (data: Buffer) => {
          reject(data.toString());
        }
      }
    });
  });
}
