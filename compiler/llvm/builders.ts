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

  br(label: string): void;
  call(name: string, params: Array<IR.Operand>): void;
  condBr(condition: IR.Operand, trueLabel: string, falseLabel: string): void;
  fsub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  getElementPointer(
    inBounds: boolean,
    type: IR.Type,
    elementType: IR.Type,
    address: IR.Operand,
    indices: Array<IR.Constant>,
  ): IR.Operand;
  label(name: string): void;
  phi(incoming: Array<[op: IR.Operand, label: string]>): IR.Operand;
  ret(c: IR.Constant): void;
  sub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;

  newLabel(prefix: string): string;
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

  newRegister: function (): string {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    return result;
  },

  br: function (label: string) {
    this.instructions.push({ tag: "IBr", label });
  },

  call: function (name: string, args: Array<IR.Operand>) {
    this.instructions.push({ tag: "Icall", name, arguments: args });
  },

  condBr(condition: IR.Operand, trueLabel: string, falseLabel: string) {
    this.instructions.push(
      { tag: "ICondBr", condition, trueLabel, falseLabel },
    );
  },

  fsub: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IFSub", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  getElementPointer: function (
    inBounds: boolean,
    type: IR.Type,
    elementType: IR.Type,
    address: IR.Operand,
    indices: Array<IR.Constant>,
  ): IR.Operand {
    const result = this.newRegister();
    this.instructions.push(
      {
        tag: "IGetElementPointer",
        result,
        inBounds,
        type,
        elementType,
        address,
        indices,
      },
    );

    return { tag: "LocalReference", type, name: result };
  },

  label: function (name: string) {
    this.instructions.push({ tag: "ILabel", name });
  },

  phi: function (
    incoming: Array<[op: IR.Operand, label: string]>,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IPhi", result, incoming });

    return {
      tag: "LocalReference",
      type: IR.typeOf(incoming[0][0]),
      name: result,
    };
  },

  ret: function (c: IR.Constant) {
    this.instructions.push({ tag: "IRet", c });
  },

  sub: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "ISub", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
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
