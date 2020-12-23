import * as IRInstruction from "./ir/instruction.ts";
import * as IRModule from "./ir/module.ts";
import * as IROperand from "./ir/operand.ts";
import * as IRType from "./ir/type.ts";

export interface ModuleBuilder {
  externalDeclarations: Array<IRModule.ExternalDeclaration>;
  globalDeclarations: Array<IRModule.GlobalDeclaration>;
  functionDeclarations: Array<IRModule.FunctionDeclaration>;

  declareExternal(
    name: string,
    args: Array<IRType.Type>,
    result: IRType.Type,
  ): ModuleBuilder;

  declareGlobal(
    name: String,
    type: IRType.Type,
    constant: boolean,
    value: IROperand.Constant,
  ): void;

  declareFunction(
    name: string,
    args: Array<[string, IRType.Type]>,
    result: IRType.Type,
  ): FunctionBuilder;

  build(): IRModule.Module;
}

export const module = (id: string): ModuleBuilder => ({
  externalDeclarations: new Array<IRModule.ExternalDeclaration>(),
  globalDeclarations: new Array<IRModule.GlobalDeclaration>(),
  functionDeclarations: new Array<IRModule.FunctionDeclaration>(),

  declareExternal: function (
    name: string,
    args: Array<IRType.Type>,
    result: IRType.Type,
  ) {
    this.externalDeclarations.push(
      { tag: "ExternalDeclaration", name, arguments: args, result },
    );

    return this;
  },

  declareGlobal: function (
    name: string,
    type: IRType.Type,
    constant: boolean,
    value: IROperand.Constant,
  ) {
    this.globalDeclarations.push(
      { tag: "GlobalDeclaration", name, value, constant, type },
    );
  },

  declareFunction: function (
    name: string,
    args: Array<[string, IRType.Type]>,
    result: IRType.Type,
  ): FunctionBuilder {
    return functionBuilder(name, args, result, this);
  },

  build: function (): IRModule.Module {
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
  instructions: Array<IRInstruction.Instruction>;

  add(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  alloca(
    type: IRType.Type,
  ): IROperand.Operand;
  and(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  br(label: string): void;
  call(
    name: string,
    type: IRType.Type,
    params: Array<IROperand.Operand>,
  ): IROperand.Operand;
  callvoid(name: string, params: Array<IROperand.Operand>): void;
  condBr(
    condition: IROperand.Operand,
    trueLabel: string,
    falseLabel: string,
  ): void;
  fadd(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  fcmp(
    op: IRInstruction.FP,
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  fdiv(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  fmul(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  fsub(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  getElementPointer(
    inBounds: boolean,
    type: IRType.Type,
    elementType: IRType.Type,
    address: IROperand.Operand,
    indices: Array<IROperand.Constant>,
  ): IROperand.Operand;
  icmp(
    op: IRInstruction.IP,
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  label(name: string): void;
  load(
    type: IRType.Type,
    operand: IROperand.Operand,
  ): IROperand.Operand;
  mul(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  or(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  phi(
    incoming: Array<[op: IROperand.Operand, label: string]>,
  ): IROperand.Operand;
  ret(op: IROperand.Operand): void;
  retvoid(): void;
  sdiv(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  store(
    target: IROperand.Operand,
    value: IROperand.Operand,
  ): void;
  sub(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  xor(
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand;
  zext(type: IRType.Type, operand: IROperand.Operand): IROperand.Operand;

  newLabel(prefix: string): string;
  declareGlobal(
    name: string,
    type: IRType.Type,
    constant: boolean,
    value: IROperand.Constant,
  ): void;

  build(): void;
}

const functionBuilder = (
  name: string,
  args: Array<[string, IRType.Type]>,
  result: IRType.Type,
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

  add: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IAdd", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  alloca: function (
    type: IRType.Type,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push(
      { tag: "IAlloca", result, type },
    );
    return IROperand.localReference(IRType.pointerType(type), result);
  },

  and: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IAnd", result, operand0, operand1 });
    return IROperand.localReference(IRType.i1, result);
  },

  br: function (label: string) {
    this.instructions.push({ tag: "IBr", label });
  },

  call: function (
    name: string,
    type: IRType.Type,
    args: Array<IROperand.Operand>,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push(
      { tag: "ICall", result, type, name, arguments: args },
    );
    return IROperand.localReference(type, result);
  },

  callvoid: function (name: string, args: Array<IROperand.Operand>) {
    this.instructions.push({ tag: "ICallVoid", name, arguments: args });
  },

  condBr(condition: IROperand.Operand, trueLabel: string, falseLabel: string) {
    this.instructions.push(
      { tag: "ICondBr", condition, trueLabel, falseLabel },
    );
  },

  fadd: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IFAdd", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  fcmp: function (
    op: IRInstruction.FP,
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IFCmp", result, op, operand0, operand1 });
    return IROperand.localReference(IRType.i1, result);
  },

  fdiv: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IFDiv", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  fmul: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IFMul", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  fsub: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IFSub", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  getElementPointer: function (
    inBounds: boolean,
    type: IRType.Type,
    elementType: IRType.Type,
    address: IROperand.Operand,
    indices: Array<IROperand.Constant>,
  ): IROperand.Operand {
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

    return IROperand.localReference(type, result);
  },

  icmp: function (
    op: IRInstruction.IP,
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IICmp", result, op, operand0, operand1 });
    return IROperand.localReference(IRType.i1, result);
  },

  label: function (name: string) {
    this.instructions.push({ tag: "ILabel", name });
  },

  load: function (
    type: IRType.Type,
    operand: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "ILoad", result, type, operand });
    return IROperand.localReference(type, result);
  },

  mul: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IMul", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  or: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IOr", result, operand0, operand1 });
    return IROperand.localReference(IRType.i1, result);
  },

  phi: function (
    incoming: Array<[op: IROperand.Operand, label: string]>,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IPhi", result, incoming });
    return IROperand.localReference(IROperand.typeOf(incoming[0][0]), result);
  },

  ret: function (c: IROperand.Constant) {
    this.instructions.push({ tag: "IRet", c });
  },

  retvoid: function () {
    this.instructions.push({ tag: "IRetVoid" });
  },

  sdiv: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "ISDiv", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  store: function (
    target: IROperand.Operand,
    value: IROperand.Operand,
  ): void {
    this.instructions.push({ tag: "IStore", target, value });
  },

  sub: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "ISub", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  xor: function (
    operand0: IROperand.Operand,
    operand1: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IXor", result, operand0, operand1 });
    return IROperand.localReference(IROperand.typeOf(operand0), result);
  },

  zext: function (
    type: IRType.Type,
    operand: IROperand.Operand,
  ): IROperand.Operand {
    const result = this.newRegister();
    this.instructions.push({ tag: "IZext", type, result, operand });
    return IROperand.localReference(type, result);
  },

  declareGlobal: (
    name: string,
    type: IRType.Type,
    constant: boolean,
    value: IROperand.Constant,
  ) => module.declareGlobal(name, type, constant, value),

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
  IRInstruction.Instruction
> => [{ tag: "ILabel", name: "entry_0" }];
