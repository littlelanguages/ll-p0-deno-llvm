import * as IEEE754 from "https://deno.land/x/ieee754@v0.1.0/mod.ts";

import * as IRType from "./type.ts";

export type Operand = LocalReference | Constant;

export type LocalReference = {
  tag: "LocalReference";
  type: IRType.Type;
  name: string;
};

export type Constant =
  | CInt
  | CHalfFP
  | CFloatFP
  | CArray
  | CAdd
  | CFAdd
  | CGetElementPtr
  | CGlobalReference
  | CZext;

export type CInt = {
  tag: "CInt";
  bits: number;
  value: number;
};

export type CHalfFP = {
  tag: "CHalfFP";
  value: number;
};

export type CFloatFP = {
  tag: "CFloatFP";
  value: number;
};

export type CArray = {
  tag: "CArray";
  memberType: IRType.Type;
  values: Array<Constant>;
};

export type CAdd = {
  tag: "CAdd";
  nsw: boolean;
  nuw: boolean;
  operand0: Constant;
  operand1: Constant;
};

export type CFAdd = {
  tag: "CFAdd";
  operand0: Constant;
  operand1: Constant;
};

export type CGlobalReference = {
  tag: "CGlobalReference";
  type: IRType.Type;
  name: string;
};

export type CGetElementPtr = {
  tag: "CGetElementPtr";
  inBounds: boolean;
  type: IRType.Type;
  elementType: IRType.Type;
  address: Constant;
  indices: Array<Constant>;
};

export type CZext = {
  tag: "Czext";
  operand: Operand;
  type: IRType.Type;
};

export const typeOf = (o: Operand): IRType.Type =>
  o.tag === "CAdd"
    ? typeOf(o.operand0)
    : o.tag === "CArray"
    ? IRType.pointerType(o.memberType)
    : o.tag === "CFAdd"
    ? typeOf(o.operand0)
    : o.tag === "CHalfFP"
    ? IRType.halfFP
    : o.tag === "CFloatFP"
    ? IRType.floatFP
    : o.tag === "CGetElementPtr"
    ? o.type
    : o.tag === "CGlobalReference"
    ? o.type
    : o.tag === "CInt"
    ? IRType.integerType(o.bits)
    : o.tag === "Czext"
    ? o.type
    : o.tag === "LocalReference"
    ? o.type
    : IRType.i1;

export const toUntypedString = (op: Operand): string =>
  op.tag === "CInt"
    ? `${op.value}`
    : op.tag === "CFloatFP"
    ? floatToString(op.value)
    : op.tag === "CArray"
    ? `[${op.values.map(toString).join(", ")}]`
    : op.tag === "CGetElementPtr"
    ? `getelementptr${op.inBounds ? " inbounds" : ""}(${
      IRType.toString(op.elementType)
    }, ${toString(op.address)}${
      op.indices.map((i) => `, ${toString(i)}`).join("")
    })`
    : op.tag === "CGlobalReference"
    ? `${op.name}`
    : op.tag === "Czext"
    ? `zext (${toString(op.operand)} to ${IRType.toString(op.type)})`
    : op.tag === "LocalReference"
    ? op.name
    : (function () {
      throw new Error(`TODO: Operand.toUntypedString: ${op.tag}`);
    })();

export const toString = (op: Operand): string =>
  op.tag === "CInt"
    ? `i${op.bits} ${op.value}`
    : op.tag === "CFloatFP"
    ? `float ${floatToString(op.value)}`
    : op.tag === "CArray"
    ? `[${op.values.map(toString).join(", ")}]`
    : op.tag === "CGetElementPtr"
    ? `${IRType.toString(op.type)} getelementptr${
      op.inBounds ? " inbounds" : ""
    }(${IRType.toString(op.elementType)}, ${toString(op.address)}${
      op.indices.map((i) => `, ${toString(i)}`).join("")
    })`
    : op.tag === "CGlobalReference"
    ? `${IRType.toString(op.type)} ${op.name}`
    : op.tag === "Czext"
    ? `${IRType.toString(op.type)} zext (${toString(op.operand)} to ${
      IRType.toString(op.type)
    })`
    : op.tag === "LocalReference"
    ? `${IRType.toString(op.type)} ${op.name}`
    : (function () {
      throw new Error(`TODO: Operand.toString: ${op.tag}`);
    })();

const floatToString = (v: number): string => {
  const buffer = new Uint8Array(8);

  IEEE754.write(buffer, v, 0, false, 52, 8);

  let result = ["0x"];
  buffer.forEach((b) => {
    const by = b.toString(16);
    if (b < 17) {
      result.push("0");
    }
    result.push(by);
  });

  return result.join("");
};
