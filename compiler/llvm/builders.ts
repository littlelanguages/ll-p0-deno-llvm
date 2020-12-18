import * as IR from "./ir.ts";

export interface ModuleBuilder {
  externalDeclarations: Array<IR.ExternalDeclaration>;
  functionDeclarations: Array<IR.FunctionDeclaration>;

  declareExternal(
    name: string,
    args: Array<IR.Type>,
    result: IR.Type,
  ): ModuleBuilder;

  declareFunction(
    name: string,
    args: Array<[string, IR.Type]>,
    result: IR.Type,
  ): FunctionBuilder;

  build(): IR.Module;
}

export const module = (id: string): ModuleBuilder => ({
  externalDeclarations: new Array<IR.ExternalDeclaration>(),
  functionDeclarations: new Array<IR.FunctionDeclaration>(),

  declareExternal: function (
    name: string,
    args: Array<IR.Type>,
    result: IR.Type,
  ) {
    this.externalDeclarations.push(
      { tag: "ExternalDeclaration", name, arguments: args, result },
    );

    return this;
  },

  declareFunction: function (
    name: string,
    args: Array<[string, IR.Type]>,
    result: IR.Type,
  ): FunctionBuilder {
    return functionBuilder(name, args, result, this);
  },

  build: function (): IR.Module {
    return {
      tag: "Module",
      id: id,
      externalDeclarations: this.externalDeclarations,
      functionDeclarations: this.functionDeclarations,
    };
  },
});

export interface FunctionBuilder {
  instructions: Array<IR.Instruction>;

  label(name: string): void;
  ret(c: IR.Constant): void;

  build(): void;
}

const functionBuilder = (
  name: string,
  args: Array<[string, IR.Type]>,
  result: IR.Type,
  module: ModuleBuilder,
) => ({
  labelCount: 1,
  instructions: initialInstructions(),

  newLabel: function (prefix: string = ""): string {
    const label = `${prefix}_${this.labelCount}`;
    this.labelCount += 1;
    return label;
  },

  label: function (name: string) {
    this.instructions.push({ tag: "ILabel", name });
  },

  ret: function (c: IR.Constant) {
    this.instructions.push({ tag: "IRet", c });
  },

  build: function () {
    module.functionDeclarations.push({
      tag: "FunctionDeclaration",
      name,
      arguments: args,
      result,
      body: this.instructions,
    });
  },
});

const initialInstructions = (): Array<
  IR.Instruction
> => [{ tag: "ILabel", name: "entry_0" }];
