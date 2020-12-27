import * as IRModule from "./ir/module.ts";
import { exec, IExecResponse, OutputMode } from "../../deps/exec.ts";

export const write = (
  module: IRModule.Module,
  fileName: string,
): Promise<void> =>
  Deno
    .create(fileName)
    .then((f) =>
      IRModule.write(module, IRModule.textWriter(f)).then(() => f.close())
    );

export const assemble = (
  sourceFileName: string,
  targetFileName: string,
): Promise<IExecResponse> =>
  exec(
    `llvm-as-9 ${sourceFileName} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );

export const compile = (
  sourceFileName: string,
  targetFileName: string,
): Promise<IExecResponse> =>
  exec(
    // `clang-9 -c -emit-llvm ${sourceFileName} -o ${targetFileName}`,
    `clang-9 -c ${sourceFileName} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );

export const link = (
  sourceFileNames: Array<string>,
  targetFileName: string,
): Promise<IExecResponse> =>
  exec(
    `llvm-link-9 ${sourceFileNames.join(" ")} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );

export const run = (
  targetFileName: string,
  args: Array<string>,
): Promise<IExecResponse> =>
  exec(
    `lli-9 ${targetFileName} ${args.join(" ")}`,
    { output: OutputMode.Capture },
  );

export const compileLink = (
  targetFileName: string,
  args: Array<string>,
): Promise<IExecResponse> =>
  exec(
    `clang-9 ${args.join(" ")} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );

export const runBinary = (target: string): Promise<IExecResponse> =>
  exec(target, { output: OutputMode.Capture });
