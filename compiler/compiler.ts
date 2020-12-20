import * as TST from "../dynamic/tst.ts";
import * as IR from "./llvm/ir.ts";
import * as Builders from "./llvm/builders.ts";

export const compile = (tst: TST.Program, name: string = "p0"): IR.Module => {
  const moduleBuilder = Object.assign(
    Builders.module(name),
    { operands: new Map(), strings: new Map() },
  );

  moduleBuilder
    .declareExternal("_print_bool", [IR.i8], IR.voidType)
    .declareExternal("_print_int", [IR.i32], IR.voidType)
    .declareExternal("_print_string", [IR.pointerType(IR.i8)], IR.voidType)
    .declareExternal("_print_float", [IR.floatFP], IR.voidType)
    .declareExternal("_print_ln", [], IR.voidType);

  compileMain(tst, moduleBuilder);

  return moduleBuilder.build();
};

const compileMain = (
  tst: TST.Program,
  moduleBuilder: ModuleBuilder,
) => {
  const functionBuilder = declareFunction("main", [], IR.i32, moduleBuilder);

  compileS(tst.s, functionBuilder);

  functionBuilder.ret({ tag: "CInt", bits: 32, value: 0 });
  functionBuilder.build();
};

const compileS = (
  s: TST.Statement,
  functionBuilder: FunctionBuilder,
) => {
  if (s.tag === "BlockStatement") {
    s.ss.forEach((s) => compileS(s, functionBuilder));
  } else if (s.tag === "CallStatement") {
    if (s.n === "print") {
      compilePrintStatement(s, functionBuilder);
    } else if (s.n === "println") {
      compilePrintStatement(s, functionBuilder);
      functionBuilder.call("_print_ln", []);
    } else {
      functionBuilder.call(
        s.n,
        s.args.map((e) => compileE(e, functionBuilder)),
      );
    }
  } else {
    throw Error(`TODO: s: ${s.tag}: ${JSON.stringify(s, null, 2)}`);
  }
};

const compilePrintStatement = (
  s: TST.CallStatement,
  functionBuilder: FunctionBuilder,
) => {
  s.args.forEach((e) => {
    const et = typeOf(e);
    let eo = compileE(e, functionBuilder);
    if (et === TST.Type.Bool) {
      eo = { tag: "Czext", operand: eo, type: IR.i8 };
    }
    const name = et ===
        TST.Type.Bool
      ? "_print_bool"
      : et === TST.Type.Int
      ? "_print_int"
      : et === TST.Type.String
      ? "_print_string"
      : "_print_float";

    functionBuilder.call(name, [eo]);
  });
};

const compileE = (
  e: TST.Expression,
  functionBuilder: FunctionBuilder,
): IR.Operand => {
  if (e.tag === "LiteralInt") {
    return { tag: "CInt", bits: 32, value: e.v };
  } else if (e.tag === "LiteralBool") {
    return { tag: "CInt", bits: 1, value: e.v ? 1 : 0 };
  } else if (e.tag === "LiteralString") {
    const op = functionBuilder.strings.get(e.v);

    if (op === undefined) {
      const name = `_${functionBuilder.strings.size}.str`;

      functionBuilder.declareGlobal(
        name,
        IR.arrayType(e.v.length + 1, IR.i8),
        {
          tag: "CArray",
          memberType: IR.i8,
          values: [...e.v.split("").map((c) => c.charCodeAt(0)), 0].map((
            c,
          ) => ({
            tag: "CInt",
            bits: 8,
            value: c,
          })),
        },
      );

      const opp: IR.CGetElementPtr = {
        tag: "CGetElementPtr",
        inBounds: true,
        type: IR.pointerType(IR.i8),
        elementType: IR.arrayType(e.v.length + 1, IR.i8),
        address: {
          tag: "CGlobalReference",
          type: IR.pointerType(IR.arrayType(e.v.length + 1, IR.i8)),
          name: name,
        },
        indices: [
          { tag: "CInt", bits: 32, value: 0 },
          { tag: "CInt", bits: 32, value: 0 },
        ],
      };

      functionBuilder.strings.set(name, opp);
      return opp;
    } else {
      return op;
    }
  } else {
    throw Error(`TODO: e: ${e.tag}: ${JSON.stringify(e, null, 2)}`);
  }
};

const typeOf = (
  a: TST.LiteralValue | TST.Expression,
): TST.Type => {
  if (a.tag === "LiteralBool") {
    return TST.Type.Bool;
  } else if (a.tag === "LiteralInt") {
    return TST.Type.Int;
  } else if (a.tag === "LiteralFloat") {
    return TST.Type.Float;
  } else if (a.tag === "LiteralString") {
    return TST.Type.String;
  } else if (a.tag === "IdentifierReference") {
    return a.t;
  } else if (a.tag === "CallExpression") {
    return a.t;
  } else if (a.tag === "UnaryExpression") {
    return typeOf(a.e);
  } else if (a.tag === "BinaryExpression") {
    return (a.op === TST.BinaryOp.Plus || a.op === TST.BinaryOp.Minus ||
        a.op === TST.BinaryOp.Times || a.op === TST.BinaryOp.Divide)
      ? typeOf(a.e1)
      : TST.Type.Bool;
  } /*if (a.tag === "TernaryExpression")*/ else {
    return typeOf(a.e2);
  }
};

interface CodegenState {
  operands: Map<string, IR.Operand>;
  strings: Map<string, IR.Operand>;
}

type ModuleBuilder = Builders.ModuleBuilder & CodegenState;
type FunctionBuilder = Builders.FunctionBuilder & CodegenState;

const declareFunction = (
  name: string,
  args: Array<[string, IR.Type]>,
  result: IR.Type,
  moduleBuilder: ModuleBuilder,
): FunctionBuilder =>
  Object.assign(
    moduleBuilder.declareFunction(name, args, result),
    { operands: moduleBuilder.operands, strings: moduleBuilder.strings },
  );
