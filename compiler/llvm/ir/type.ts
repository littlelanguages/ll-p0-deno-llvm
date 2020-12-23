export type Type =
  | VoidType
  | IntegerType
  | PointerType
  | FloatingPointType
  | FunctionType
  | StructureType
  | ArrayType;

export type VoidType = {
  tag: "Type-Void";
};

export type IntegerType = {
  tag: "Type-Integer";
  bits: number; // integer
};

export type PointerType = {
  tag: "Type-Pointer";
  type: Type;
};

export type FloatingPointType = HalfFP | FloatFP | DoubleFP;

export type HalfFP = {
  tag: "Type-HalfFP";
};

export const halfFP: HalfFP = { tag: "Type-HalfFP" };

export type FloatFP = {
  tag: "Type-FloatFP";
};

export const floatFP: FloatFP = { tag: "Type-FloatFP" };

export type DoubleFP = {
  tag: "Type-DoubleFP";
};

export const doubleFP: DoubleFP = { tag: "Type-DoubleFP" };

export type FunctionType = {
  tag: "Type-Function";
  arguments: Array<Type>;
  result: Type;
  isVarArg: boolean;
};

export type StructureType = {
  tag: "Type-Structure";
  isPacked: boolean;
  elements: Array<Type>;
};

export type ArrayType = {
  tag: "Type-Array";
  size: number;
  element: Type;
};

export const voidType: VoidType = { tag: "Type-Void" };

export const integerType = (bits: number): IntegerType => ({
  tag: "Type-Integer",
  bits,
});

export const i1 = integerType(1);
export const i8 = integerType(8);
export const i16 = integerType(16);
export const i32 = integerType(32);
export const i64 = integerType(64);
export const i128 = integerType(128);

export const pointerType = (type: Type): PointerType => ({
  tag: "Type-Pointer",
  type,
});

export const functionType = (
  result: Type,
  args: Array<Type>,
  isVarArg: boolean = false,
): FunctionType => ({
  tag: "Type-Function",
  arguments: args,
  result,
  isVarArg,
});

export const structureType = (
  elements: Array<Type>,
  isPacked: boolean = false,
): StructureType => ({
  tag: "Type-Structure",
  isPacked,
  elements,
});

export const arrayType = (size: number, element: Type): ArrayType => ({
  tag: "Type-Array",
  size,
  element,
});

export const toString = (type: Type): string =>
  type.tag === "Type-Void"
    ? "void"
    : type.tag === "Type-Integer"
    ? `i${type.bits}`
    : type.tag === "Type-Pointer"
    ? `${toString(type.type)}*`
    : type.tag === "Type-HalfFP"
    ? "half"
    : type.tag === "Type-FloatFP"
    ? "float"
    : type.tag === "Type-DoubleFP"
    ? "double"
    : type.tag === "Type-Function"
    ? (type.isVarArg
      ? `${toString(type.result)} (${
        [...type.arguments.map(toString), "..."].join(", ")
      })`
      : `${toString(type.result)} (${type.arguments.map(toString).join(", ")})`)
    : type.tag === "Type-Structure"
    ? (type.isPacked
      ? `<{ ${type.elements.map(toString).join(", ")} }>`
      : `{ ${type.elements.map(toString).join(", ")} }`)
    : `[${type.size} x ${toString(type.element)}]`;
