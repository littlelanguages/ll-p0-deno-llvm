import * as IR from "./ir.ts";
import { exec, IExecResponse, OutputMode } from "../../deps/exec.ts";

export const write = (
  module: IR.Module,
  fileName: string,
): Promise<void> =>
  Deno
    .create(fileName)
    .then((f) => IR.write(module, IR.textWriter(f)).then(() => f.close()));

export const assemble = async (
  sourceFileName: string,
  targetFileName: string,
): Promise<IExecResponse> => {
  return await exec(
    `llvm-as-11 ${sourceFileName} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );
};

export const compile = async (
  sourceFileName: string,
  targetFileName: string,
): Promise<IExecResponse> => {
  return await exec(
    `clang-11 -c -emit-llvm ${sourceFileName} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );
};

export const link = async (
  sourceFileNames: Array<string>,
  targetFileName: string,
): Promise<IExecResponse> => {
  return await exec(
    `llvm-link-11 ${sourceFileNames.join(" ")} -o ${targetFileName}`,
    { output: OutputMode.Capture },
  );
};

export const run = async (
  targetFileName: string,
  args: Array<string>,
): Promise<IExecResponse> => {
  return await exec(
    `lli-11 ${targetFileName} ${args.join(" ")}`,
    { output: OutputMode.Capture },
  );
};
