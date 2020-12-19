export type Module = {
  tag: "Module";
  id: string;

  externalDeclarations: Array<ExternalDeclaration>;
  functionDeclarations: Array<FunctionDeclaration>;
};

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

export const voidType: VoidType = { tag: "Type-Void" };

export type IntegerType = {
  tag: "Type-Integer";
  bits: number; // integer
};

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

export type PointerType = {
  tag: "Type-Pointer";
  type: Type;
};

export const pointerType = (type: Type): PointerType => ({
  tag: "Type-Pointer",
  type,
});

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

export type StructureType = {
  tag: "Type-Structure";
  isPacked: boolean;
  elements: Array<Type>;
};

export const structureType = (
  elements: Array<Type>,
  isPacked: boolean = false,
): StructureType => ({
  tag: "Type-Structure",
  isPacked,
  elements,
});

export type ArrayType = {
  tag: "Type-Array";
  size: number;
  element: Type;
};

export const arrayType = (size: number, element: Type): ArrayType => ({
  tag: "Type-Array",
  size,
  element,
});

export const typeToString = (type: Type): string =>
  type.tag === "Type-Void"
    ? "void"
    : type.tag === "Type-Integer"
    ? `i${type.bits}`
    : type.tag === "Type-Pointer"
    ? `${typeToString(type.type)}*`
    : type.tag === "Type-HalfFP"
    ? "half"
    : type.tag === "Type-FloatFP"
    ? "float"
    : type.tag === "Type-DoubleFP"
    ? "double"
    : type.tag === "Type-Function"
    ? (type.isVarArg
      ? `${typeToString(type.result)} (${
        [...type.arguments.map(typeToString), "..."].join(", ")
      })`
      : `${typeToString(type.result)} (${
        type.arguments.map(typeToString).join(", ")
      })`)
    : type.tag === "Type-Structure"
    ? (type.isPacked
      ? `<{ ${type.elements.map(typeToString).join(", ")} }>`
      : `{ ${type.elements.map(typeToString).join(", ")} }`)
    : `[${type.size} x ${typeToString(type.element)}]`;

export type ExternalDeclaration = {
  tag: "ExternalDeclaration";
  name: string;
  arguments: Array<Type>;
  result: Type;
};

export type FunctionDeclaration = {
  tag: "FunctionDeclaration";
  name: string;
  arguments: Array<[string, Type]>;
  result: Type;
  body: Body;
};

export type Body = Array<Instruction>;

export type Operand = LocalReference | Constant;

export type LocalReference = {
  tag: "LocalReference";
  type: Type;
  name: string;
};

export type Constant = CInt | CFloatSingle | CAdd | CFAdd | CGetElementPtr;

export type CInt = {
  tag: "CInt";
  bits: number;
  value: number;
};

export type CFloatSingle = {
  tag: "CFloatSingle";
  value: number;
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

export type CGetElementPtr = {
  tag: "CGetElementPtr";
  inBounds: boolean;
  address: Constant;
  indices: Array<Constant>;
};

const constantToString = (c: Constant): string =>
  c.tag === "CInt" ? `i${c.bits} ${c.value}` : (function () {
    throw new Error(`TODO: constantToString: ${c.tag}`);
  })();

export type Instruction = ILabel | IRet;

export type ILabel = {
  tag: "ILabel";
  name: string;
};

export type IRet = {
  tag: "IRet";
  c: Constant;
};

export const write = async (
  module: Module,
  w: TextWriter,
): Promise<any> => {
  const writeFunctionDeclaration = (d: FunctionDeclaration): Promise<any> => {
    const header = w.write(
      `\ndefine external ccc ${typeToString(d.result)} @${d.name}(${
        d.arguments.map(([n, t]) => `${typeToString(t)} %${n}}`).join(", ")
      }) {\n`,
    );

    return d.body.reduce((a, s) => {
      const line = (s.tag === "ILabel")
        ? `${s.name}:\n`
        : `  ret ${constantToString(s.c)}\n`;

      return a.then(() => w.write(line));
    }, header).then(() => w.write("}"));
  };

  const p1 = w.write(`; ModuleID = '${module.id}'\n`);

  return module.functionDeclarations.reduce(
    (a, d) => a.then(() => writeFunctionDeclaration(d)),
    p1,
  );
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
