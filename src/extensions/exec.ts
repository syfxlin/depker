import { copy } from "https://deno.land/std@0.133.0/streams/conversion.ts";

export type ExecOptions = {
  cmd: readonly string[] | [URL, ...string[]];
  cwd?: string;
  env?: Record<string, string>;
  input?: Deno.Reader;
  output?: "inherit" | "piped" | "null";
};

export default async function exec<T>(
  options: ExecOptions
): Promise<{
  status: Deno.ProcessStatus;
  stdout: Uint8Array;
  stderr: Uint8Array;
}> {
  const p = Deno.run({
    cmd: options.cmd,
    cwd: options.cwd,
    env: options.env,
    stdin: "piped",
    stdout: options.output,
    stderr: options.output,
  });

  // input
  if (options.input) {
    await copy(options.input, p.stdin);
  }
  p.stdin.close();

  // output
  let result: {
    status: Deno.ProcessStatus;
    stdout: Uint8Array;
    stderr: Uint8Array;
  };
  if (options.output === "piped") {
    const [status, stdout, stderr] = (await Promise.all([
      p.status(),
      p.output(),
      p.stderrOutput(),
    ])) as any;
    result = { status, stdout, stderr };
  } else {
    result = {
      status: await p.status(),
      stdout: new Uint8Array(0),
      stderr: new Uint8Array(0),
    };
  }

  // close
  p.close();

  // error
  if (!result.status.success) {
    throw new Error(
      `Command failed with exit code ${result.status.code}: ${options.cmd.join(
        " "
      )}`
    );
  }

  return result;
}
