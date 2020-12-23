import * as IROperand from "./operand.ts";
import * as IRType from "./type.ts";

export enum IP {
  EQ = "eq",
  NQ = "ne",
  UGT = "ugt",
  UGE = "uge",
  ULT = "ult",
  ULE = "ule",
  SGT = "sgt",
  SGE = "sge",
  SLT = "slt",
  SLE = "sle",
}

export enum FP {
  FALSE = "false",
  OEQ = "oeq",
  OGT = "ogt",
  OGE = "oge",
  OLT = "olt",
  OLE = "ole",
  ONE = "one",
  ORD = "ord",
  UEQ = "ueq",
  UGT = "ugt",
  UGE = "uge",
  ULT = "ult",
  ULE = "ule",
  UNE = "une",
  UNO = "uno",
  TRUE = "true",
}

export type Instruction =
  | IAdd
  | IAlloca
  | IAnd
  | IBr
  | ICall
  | ICallVoid
  | ICondBr
  | IFAdd
  | IFCmp
  | IFDiv
  | IFMul
  | IFSub
  | IGetElementPointer
  | IICmp
  | ILabel
  | ILoad
  | IMul
  | IOr
  | IPhi
  | IRet
  | IRetVoid
  | ISDiv
  | IStore
  | ISub
  | IXor
  | IZext;

export type IAdd = {
  tag: "IAdd";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IAlloca = {
  tag: "IAlloca";
  result: string;
  type: IRType.Type;
  alignment: number | undefined;
};

export type IAnd = {
  tag: "IAnd";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IBr = {
  tag: "IBr";
  label: string;
};

export type ICall = {
  tag: "ICall";
  result: string;
  name: string;
  type: IRType.Type;
  arguments: Array<IROperand.Operand>;
};

export type ICallVoid = {
  tag: "ICallVoid";
  name: string;
  arguments: Array<IROperand.Operand>;
};

export type ICondBr = {
  tag: "ICondBr";
  condition: IROperand.Operand;
  trueLabel: string;
  falseLabel: string;
};

export type IFAdd = {
  tag: "IFAdd";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IFDiv = {
  tag: "IFDiv";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IFMul = {
  tag: "IFMul";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IFCmp = {
  tag: "IFCmp";
  result: string;
  op: FP;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IFSub = {
  tag: "IFSub";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IGetElementPointer = {
  tag: "IGetElementPointer";
  result: string;
  inBounds: boolean;
  type: IRType.Type;
  elementType: IRType.Type;
  address: IROperand.Operand;
  indices: Array<IROperand.Constant>;
};

export type IICmp = {
  tag: "IICmp";
  result: string;
  op: IP;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type ILabel = {
  tag: "ILabel";
  name: string;
};

export type ILoad = {
  tag: "ILoad";
  result: string;
  type: IRType.Type;
  operand: IROperand.Operand;
  alignment: number | undefined;
};

export type IMul = {
  tag: "IMul";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IOr = {
  tag: "IOr";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IPhi = {
  tag: "IPhi";
  result: string;
  incoming: Array<[IROperand.Operand, string]>;
};

export type IRet = {
  tag: "IRet";
  c: IROperand.Constant;
};

export type IRetVoid = {
  tag: "IRetVoid";
};

export type ISDiv = {
  tag: "ISDiv";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IStore = {
  tag: "IStore";
  target: IROperand.Operand;
  alignment: number | undefined;
  value: IROperand.Operand;
};

export type ISub = {
  tag: "ISub";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IXor = {
  tag: "IXor";
  result: string;
  operand0: IROperand.Operand;
  operand1: IROperand.Operand;
};

export type IZext = {
  tag: "IZext";
  result: string;
  type: IRType.Type;
  operand: IROperand.Operand;
};

export const toString = (i: Instruction): string =>
  i.tag === "IAdd"
    ? `  ${i.result} = add ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IAlloca"
    ? `  ${i.result} = alloca ${IRType.toString(i.type)} ${
      i.alignment === undefined ? "" : `, align ${i.alignment}`
    }\n`
    : i.tag === "IAnd"
    ? `  ${i.result} = and ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IBr"
    ? `  br label %${i.label}\n`
    : i.tag === "ICall"
    ? `  ${i.result} = call ccc ${IRType.toString(i.type)} ${i.name}(${
      i.arguments.map(IROperand.toString).join(", ")
    })\n`
    : i.tag === "ICallVoid"
    ? `  call ccc void ${i.name}(${
      i.arguments.map(IROperand.toString).join(", ")
    })\n`
    : i.tag === "ICondBr"
    ? `  br ${
      IROperand.toString(i.condition)
    }, label %${i.trueLabel}, label %${i.falseLabel}\n`
    : i.tag === "IFAdd"
    ? `  ${i.result} = fadd ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IFCmp"
    ? `  ${i.result} = fcmp ${i.op} ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IFDiv"
    ? `  ${i.result} = fdiv ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IFSub"
    ? `  ${i.result} = fsub ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IFMul"
    ? `  ${i.result} = fmul ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IGetElementPointer"
    ? `  ${i.result} = getelementptr${i.inBounds ? " inbounds" : ""} ${
      IRType.toString(i.elementType)
    }, ${IROperand.toString(i.address)}${
      i.indices.map((i) => `, ${IROperand.toString(i)}`).join("")
    }\n`
    : i.tag === "IICmp"
    ? `  ${i.result} = icmp ${i.op} ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "ILabel"
    ? `${i.name}:\n`
    : i.tag === "ILoad"
    ? `  ${i.result} = load ${IRType.toString(i.type)}, ${
      IROperand.toString(i.operand)
    }${i.alignment === undefined ? "" : `, align ${i.alignment}`}\n`
    : i.tag === "IOr"
    ? `  ${i.result} = or ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IMul"
    ? `  ${i.result} = mul ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IPhi"
    ? `  ${i.result} = phi ${
      IRType.toString(IROperand.typeOf(i.incoming[0][0]))
    } ${
      i.incoming.map(([o, l]) => `[${IROperand.toUntypedString(o)}, %${l}]`)
        .join(", ")
    }\n`
    : i.tag === "IRet"
    ? `  ret ${IROperand.toString(i.c)}\n`
    : i.tag === "IRetVoid"
    ? `  ret void\n`
    : i.tag === "ISDiv"
    ? `  ${i.result} = sdiv ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IStore"
    ? `  store ${IROperand.toString(i.value)}, ${IROperand.toString(i.target)}${
      i.alignment === undefined ? "" : `, align ${i.alignment}`
    }\n`
    : i.tag === "ISub"
    ? `  ${i.result} = sub ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : i.tag === "IXor"
    ? `  ${i.result} = xor ${IROperand.toString(i.operand0)}, ${
      IROperand.toUntypedString(i.operand1)
    }\n`
    : /* s.tag === "IZext" */ `  ${i.result} = zext ${
      IROperand.toString(i.operand)
    } to ${IRType.toString(i.type)}\n`;
