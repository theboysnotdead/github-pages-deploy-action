import { exec } from "@actions/exec";
import { rejects } from "assert";

export async function execute(cmd: string, cwd: string): Promise<String> {
  return new Promise((resolve, reject) => {
    exec(cmd, [], {
      cwd, 
      listeners: {
        stdout: (data: Buffer) => {
          resolve(data.toString().trim());
        },
        stderr: (data: Buffer) => {
          reject(data.toString().trim());
        }
      }
    });
  });
}
