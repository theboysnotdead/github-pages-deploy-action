import { exec } from "child_process";

export async function execute(cmd: string): Promise<String> {
  return new Promise(resolve => {
    exec(cmd, (error, stdout) => {
      resolve(stdout.trim());
    });
  });
}
