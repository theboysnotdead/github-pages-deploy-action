import { exec } from "@actions/exec";
import { rejects } from "assert";

export async function execute(cmd: string): Promise<String> {
  return new Promise((resolve, reject) => {
    exec(cmd, [], {
      cwd: "./public",
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
