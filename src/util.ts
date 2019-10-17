import { exec } from "child_process";
import { rejects } from "assert";

export async function execute(cmd: string): Promise<String> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout) => {
      if (error) {
        reject(error)

        console.log(error)
      }
      resolve(stdout.trim());
    });
  });
}
