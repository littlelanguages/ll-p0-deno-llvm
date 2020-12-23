import * as IRInstruction from "./instruction.ts";
import * as IROperand from "./operand.ts";
import * as IRType from "./type.ts";

export type Module = {
  tag: "Module";
  id: string;

  externalDeclarations: Array<ExternalDeclaration>;
  globalDeclarations: Array<GlobalDeclaration>;
  functionDeclarations: Array<FunctionDeclaration>;
};

export type ExternalDeclaration = {
  tag: "ExternalDeclaration";
  name: string;
  arguments: Array<IRType.Type>;
  result: IRType.Type;
};

export type GlobalDeclaration = {
  tag: "GlobalDeclaration";
  name: string;
  type: IRType.Type;
  constant: boolean;
  value: IROperand.Constant;
};

export type FunctionDeclaration = {
  tag: "FunctionDeclaration";
  name: string;
  arguments: Array<[string, IRType.Type]>;
  result: IRType.Type;
  body: Array<IRInstruction.Instruction>;
};

export const write = (
  module: Module,
  w: TextWriter,
): Promise<any> => {
  const writeExternalDeclararion = (d: ExternalDeclaration): Promise<any> =>
    w.write(
      `\ndeclare external ccc ${IRType.toString(d.result)} ${d.name}(${
        d.arguments.map(IRType.toString).join(", ")
      })\n`,
    );

  const writeGlobalDeclaration = (d: GlobalDeclaration): Promise<any> =>
    d.constant
      ? w.write(
        `\n${d.name} = unnamed_addr constant ${IRType.toString(d.type)} ${
          IROperand.toString(d.value)
        }\n`,
      )
      : w.write(`\n${d.name} = global ${IROperand.toString(d.value)}\n`);

  const writeFunctionDeclaration = (d: FunctionDeclaration): Promise<any> => {
    const header = w.write(
      `\ndefine external ccc ${IRType.toString(d.result)} ${d.name}(${
        d.arguments.map(([n, t]) => `${IRType.toString(t)} %${n}`).join(", ")
      }) {\n`,
    );

    return d.body.reduce(
      (a, s) => a.then(() => w.write(IRInstruction.toString(s))),
      header,
    ).then(() => w.write("}"));
  };

  const p1 = w.write(`; ModuleID = '${module.id}'\n`);
  const p2 = module.externalDeclarations.reduce(
    (p, d) => p.then(() => writeExternalDeclararion(d)),
    p1,
  );
  const p3 = module.globalDeclarations.reduce(
    (p, d) => p.then(() => writeGlobalDeclaration(d)),
    p2,
  );
  const p4 = module.functionDeclarations.reduce(
    (p, d) => p.then(() => writeFunctionDeclaration(d)),
    p3,
  );

  return p4;
};

export interface TextWriter {
  write(text: string): Promise<number>;
}

export const textWriter = (w: Deno.Writer): TextWriter => {
  const encoder = new TextEncoder();

  return {
    write: (text: string): Promise<number> => w.write(encoder.encode(text)),
  };
};
