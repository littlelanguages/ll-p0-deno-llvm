import * as IR from "./ir.ts";

export interface ModuleBuilder {
  externalDeclarations: Array<IR.ExternalDeclaration>;
  globalDeclarations: Array<IR.GlobalDeclaration>;
  functionDeclarations: Array<IR.FunctionDeclaration>;

  declareExternal(
    name: string,
    args: Array<IR.Type>,
    result: IR.Type,
  ): ModuleBuilder;

  declareGlobal(name: String, type: IR.Type, value: IR.Constant): void;

  declareFunction(
    name: string,
    args: Array<[string, IR.Type]>,
    result: IR.Type,
  ): FunctionBuilder;

  build(): IR.Module;
}

export const module = (id: string): ModuleBuilder => ({
  externalDeclarations: new Array<IR.ExternalDeclaration>(),
  globalDeclarations: new Array<IR.GlobalDeclaration>(),
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

  declareGlobal: function (
    name: string,
    type: IR.Type,
    value: IR.Constant,
  ) {
    this.globalDeclarations.push(
      { tag: "GlobalDeclaration", name, value, type },
    );
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
      globalDeclarations: this.globalDeclarations,
      functionDeclarations: this.functionDeclarations,
    };
  },
});

export interface FunctionBuilder {
  instructions: Array<IR.Instruction>;

  call(name: string, params: Array<IR.Operand>): void;
  fsub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  label(name: string): void;
  ret(c: IR.Constant): void;
  sub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;

  declareGlobal(name: string, type: IR.Type, value: IR.Constant): void;

  build(): void;
}

const functionBuilder = (
  name: string,
  args: Array<[string, IR.Type]>,
  result: IR.Type,
  module: ModuleBuilder,
) => ({
  labelCount: 1,
  registerCount: 0,
  instructions: initialInstructions(),

  newLabel: function (prefix: string = ""): string {
    const label = `${prefix}_${this.labelCount}`;
    this.labelCount += 1;
    return label;
  },

  call: function (name: string, args: Array<IR.Operand>) {
    this.instructions.push({ tag: "Icall", name, arguments: args });
  },

  fsub: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IFSub", result, operand0, operand1 });
    return { tag: "LocalReference", type: typeOf(operand0), name: result };
  },

  label: function (name: string) {
    this.instructions.push({ tag: "ILabel", name });
  },

  ret: function (c: IR.Constant) {
    this.instructions.push({ tag: "IRet", c });
  },

  sub: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "ISub", result, operand0, operand1 });
    return { tag: "LocalReference", type: typeOf(operand0), name: result };
  },

  declareGlobal: (
    name: string,
    type: IR.Type,
    value: IR.Constant,
  ) => module.declareGlobal(name, type, value),

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

const typeOf = (o: IR.Operand): IR.Type =>
  o.tag === "CAdd"
    ? typeOf(o.operand0)
    : o.tag === "CArray"
    ? IR.pointerType(o.memberType)
    : o.tag === "CFAdd"
    ? typeOf(o.operand0)
    : o.tag === "CHalfFP"
    ? IR.halfFP
    : o.tag === "CFloatFP"
    ? IR.floatFP
    : o.tag === "CGetElementPtr"
    ? o.type
    : o.tag === "CGlobalReference"
    ? o.type
    : o.tag === "CInt"
    ? IR.integerType(o.bits)
    : o.tag === "Czext"
    ? o.type
    : o.tag === "LocalReference"
    ? o.type
    : IR.i1;
