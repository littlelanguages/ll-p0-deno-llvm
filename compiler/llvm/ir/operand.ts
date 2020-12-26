import * as IEEE754 from "https://deno.land/x/ieee754@v0.1.0/mod.ts";

import * as IRType from "./type.ts";

export type Operand = LocalReference | Constant;

type LocalReference = {
  tag: "LocalReference";
  type: IRType.Type;
  name: string;
};

export const localReference = (
  type: IRType.Type,
  name: string,
): LocalReference => ({ tag: "LocalReference", type, name });

export type Constant =
  | CInt
  | CHalfFP
  | CFloatFP
  | CArray
  | CGlobalReference;

type CInt = {
  tag: "CInt";
  bits: number;
  value: number;
};

export const cint = (bits: number, value: number): CInt => ({
  tag: "CInt",
  bits,
  value,
});

type CHalfFP = {
  tag: "CHalfFP";
  value: number;
};

export const chalfFP = (value: number): CHalfFP => ({
  tag: "CHalfFP",
  value,
});

type CFloatFP = {
  tag: "CFloatFP";
  value: number;
};

export const cfloatFP = (value: number): CFloatFP => ({
  tag: "CFloatFP",
  value,
});

type CArray = {
  tag: "CArray";
  memberType: IRType.Type;
  values: Array<Constant>;
};

export const carray = (
  memberType: IRType.Type,
  values: Array<Constant>,
): CArray => ({
  tag: "CArray",
  memberType,
  values,
});

type CGlobalReference = {
  tag: "CGlobalReference";
  type: IRType.Type;
  name: string;
};

export const cglobalReference = (
  type: IRType.Type,
  name: string,
): CGlobalReference => ({
  tag: "CGlobalReference",
  type,
  name,
});

export const typeOf = (o: Operand): IRType.Type =>
  o.tag === "CArray"
    ? IRType.pointerType(o.memberType)
    : o.tag === "CHalfFP"
    ? IRType.halfFP
    : o.tag === "CFloatFP"
    ? IRType.floatFP
    : o.tag === "CGlobalReference"
    ? o.type
    : o.tag === "CInt"
    ? IRType.integerType(o.bits)
    : o.tag === "LocalReference"
    ? o.type
    : IRType.i1;

export const toUntypedString = (op: Operand): string =>
  op.tag === "CInt"
    ? `${op.value}`
    : op.tag === "CFloatFP"
    ? `fptrunc (double ${floatToString(op.value)} to float)`
    : op.tag === "CArray"
    ? `[${op.values.map(toString).join(", ")}]`
    : op.tag === "CGlobalReference"
    ? `${op.name}`
    : op.tag === "LocalReference"
    ? op.name
    : (function () {
      throw new Error(`TODO: Operand.toUntypedString: ${op.tag}`);
    })();

export const toString = (op: Operand): string =>
  op.tag === "CInt"
    ? `i${op.bits} ${op.value}`
    : op.tag === "CFloatFP"
    ? `float fptrunc (double ${floatToString(op.value)} to float)`
    // ? `float fptrunc (double ${floatToString(op.value)} to float)`
    : op.tag === "CArray"
    ? `[${op.values.map(toString).join(", ")}]`
    : op.tag === "CGlobalReference"
    ? `${IRType.toString(op.type)} ${op.name}`
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
    if (b < 16) {
      result.push("0");
    }
    result.push(by);
  });

  return result.join("");
};
