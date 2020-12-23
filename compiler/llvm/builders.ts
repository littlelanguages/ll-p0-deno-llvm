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

  add(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  alloca(
    type: IR.Type,
    alignment: number | undefined,
  ): IR.Operand;
  and(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  br(label: string): void;
  call(name: string, type: IR.Type, params: Array<IR.Operand>): IR.Operand;
  callvoid(name: string, params: Array<IR.Operand>): void;
  condBr(condition: IR.Operand, trueLabel: string, falseLabel: string): void;
  fadd(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  fcmp(op: IR.FP, operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  fdiv(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  fmul(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  fsub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  getElementPointer(
    inBounds: boolean,
    type: IR.Type,
    elementType: IR.Type,
    address: IR.Operand,
    indices: Array<IR.Constant>,
  ): IR.Operand;
  icmp(op: IR.IP, operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  label(name: string): void;
  load(
    type: IR.Type,
    operand: IR.Operand,
    alignment: number | undefined,
  ): IR.Operand;
  mul(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  or(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  phi(incoming: Array<[op: IR.Operand, label: string]>): IR.Operand;
  ret(op: IR.Operand): void;
  sdiv(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  store(
    target: IR.Operand,
    alignment: number | undefined,
    value: IR.Operand,
  ): void;
  sub(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  xor(operand0: IR.Operand, operand1: IR.Operand): IR.Operand;
  zext(type: IR.Type, operand: IR.Operand): IR.Operand;

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

  add: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IAdd", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  alloca: function (
    type: IR.Type,
    alignment: number | undefined,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push(
      { tag: "IAlloca", result, type, alignment },
    );

    return {
      tag: "LocalReference",
      type: IR.pointerType(type),
      name: result,
    };
  },

  and: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IAnd", result, operand0, operand1 });

    return {
      tag: "LocalReference",
      type: IR.i1,
      name: result,
    };
  },

  br: function (label: string) {
    this.instructions.push({ tag: "IBr", label });
  },

  call: function (
    name: string,
    type: IR.Type,
    args: Array<IR.Operand>,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push(
      { tag: "ICall", result, type, name, arguments: args },
    );

    return { tag: "LocalReference", type, name: result };
  },

  callvoid: function (name: string, args: Array<IR.Operand>) {
    this.instructions.push({ tag: "ICallVoid", name, arguments: args });
  },

  condBr(condition: IR.Operand, trueLabel: string, falseLabel: string) {
    this.instructions.push(
      { tag: "ICondBr", condition, trueLabel, falseLabel },
    );
  },

  fadd: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IFAdd", result, operand0, operand1 });

    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  fcmp: function (
    op: IR.FP,
    operand0: IR.Operand,
    operand1: IR.Operand,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IFCmp", result, op, operand0, operand1 });

    return {
      tag: "LocalReference",
      type: IR.i1,
      name: result,
    };
  },

  fdiv: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IFDiv", result, operand0, operand1 });

    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  fmul: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IFMul", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
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

  icmp: function (
    op: IR.IP,
    operand0: IR.Operand,
    operand1: IR.Operand,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IICmp", result, op, operand0, operand1 });

    return {
      tag: "LocalReference",
      type: IR.i1,
      name: result,
    };
  },

  label: function (name: string) {
    this.instructions.push({ tag: "ILabel", name });
  },

  load: function (
    type: IR.Type,
    operand: IR.Operand,
    alignment: number | undefined,
  ): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "ILoad", result, type, operand, alignment });

    return {
      tag: "LocalReference",
      type,
      name: result,
    };
  },

  mul: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IMul", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  or: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IOr", result, operand0, operand1 });

    return {
      tag: "LocalReference",
      type: IR.i1,
      name: result,
    };
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

  sdiv: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "ISDiv", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  store: function (
    target: IR.Operand,
    alignment: number | undefined,
    value: IR.Operand,
  ): void {
    this.instructions.push({ tag: "IStore", target, alignment, value });
  },

  sub: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "ISub", result, operand0, operand1 });
    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  xor: function (operand0: IR.Operand, operand1: IR.Operand): IR.Operand {
    const result = this.newRegister();

    this.instructions.push({ tag: "IXor", result, operand0, operand1 });

    return { tag: "LocalReference", type: IR.typeOf(operand0), name: result };
  },

  zext: function (type: IR.Type, operand: IR.Operand): IR.Operand {
    const result = `%${this.registerCount}`;
    this.registerCount += 1;
    this.instructions.push({ tag: "IZext", type, result, operand });
    return { tag: "LocalReference", type, name: result };
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
