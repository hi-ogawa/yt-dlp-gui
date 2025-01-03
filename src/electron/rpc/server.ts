import { execFile } from "child_process";
import { promisify } from "util";

const execPromise = promisify(execFile);

export const rpcRoutes = {
	async command(file: string, args: string[]) {
		const result = await execPromise(file, args);
		return {
			code: 0,
			stdout: result.stdout,
			stderr: result.stderr,
		};
	},
	async readFile() {},
};
