import * as TST from "../dynamic/tst.ts";
import * as IR from "./llvm/ir.ts";
import * as Builders from "./llvm/builders.ts";

export const compile = (tst: TST.Program, name: string = "p0"): IR.Module => {
  const moduleBuilder = Object.assign(
    Builders.module(name),
    { operands: new Map(), strings: new Map() },
  );

  moduleBuilder
    .declareExternal("@_print_bool", [IR.i8], IR.voidType)
    .declareExternal("@_print_int", [IR.i32], IR.voidType)
    .declareExternal("@_print_string", [IR.pointerType(IR.i8)], IR.voidType)
    .declareExternal("@_print_float", [IR.floatFP], IR.voidType)
    .declareExternal("@_print_ln", [], IR.voidType);

  compileMain(tst, moduleBuilder);

  return moduleBuilder.build();
};

const compileMain = (
  tst: TST.Program,
  moduleBuilder: ModuleBuilder,
) => {
  const functionBuilder = declareFunction("@main", [], IR.i32, moduleBuilder);

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
      functionBuilder.call("@_print_ln", []);
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
      eo = functionBuilder.zext(IR.i8, eo);
    }
    const name = et ===
        TST.Type.Bool
      ? "@_print_bool"
      : et === TST.Type.Int
      ? "@_print_int"
      : et === TST.Type.String
      ? "@_print_string"
      : "@_print_float";

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
    let op = functionBuilder.strings.get(e.v);

    if (op === undefined) {
      const name = `@_${functionBuilder.strings.size}.str`;

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
      op = {
        tag: "CGlobalReference",
        type: IR.pointerType(IR.arrayType(e.v.length + 1, IR.i8)),
        name: name,
      };

      functionBuilder.strings.set(name, op);
    }

    const opp = functionBuilder.getElementPointer(
      true,
      IR.pointerType(IR.i8),
      IR.arrayType(e.v.length + 1, IR.i8),
      op,
      [
        { tag: "CInt", bits: 32, value: 0 },
        { tag: "CInt", bits: 32, value: 0 },
      ],
    );

    return opp;
  } else if (e.tag === "LiteralFloat") {
    return { tag: "CFloatFP", value: e.v };
  } else if (e.tag === "UnaryExpression") {
    const op = compileE(e.e, functionBuilder);

    if (e.op === TST.UnaryOp.UnaryPlus) {
      return op;
    } else if (e.op === TST.UnaryOp.UnaryMinus) {
      if (typeOf(e.e) === TST.Type.Float) {
        return functionBuilder.fsub({ tag: "CFloatFP", value: 0.0 }, op);
      } else {
        return functionBuilder.sub({ tag: "CInt", bits: 32, value: 0 }, op);
      }
    } else { //e.op === TST.UnaryOp.UnaryNot
      return op;
    }
  } else if (e.tag === "TernaryExpression") {
    const thenBlock = functionBuilder.newLabel("then");
    const elseBlock = functionBuilder.newLabel("else");
    const mergeBlock = functionBuilder.newLabel("merge");

    const e1 = compileE(e.e1, functionBuilder);

    functionBuilder.condBr(e1, thenBlock, elseBlock);

    functionBuilder.label(thenBlock);
    const e2 = compileE(e.e2, functionBuilder);
    functionBuilder.br(mergeBlock);

    functionBuilder.label(elseBlock);
    const e3 = compileE(e.e3, functionBuilder);
    functionBuilder.br(mergeBlock);

    functionBuilder.label(mergeBlock);
    return functionBuilder.phi([[e2, thenBlock], [e3, elseBlock]]);
  } else if (e.tag === "BinaryExpression") {
    const e1 = compileE(e.e1, functionBuilder);
    const e2 = compileE(e.e2, functionBuilder);

    if (e.op === TST.BinaryOp.And) {
      return functionBuilder.and(e1, e2);
    } else if (e.op === TST.BinaryOp.Or) {
      return functionBuilder.or(e1, e2);
    } else if (e.op === TST.BinaryOp.Equal) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.OEQ, e1, e2)
        : functionBuilder.icmp(IR.IP.EQ, e1, e2);
    } else if (e.op === TST.BinaryOp.NotEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.ONE, e1, e2)
        : functionBuilder.icmp(IR.IP.NQ, e1, e2);
    } else if (e.op === TST.BinaryOp.LessThan) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.OLT, e1, e2)
        : functionBuilder.icmp(IR.IP.SLT, e1, e2);
    } else if (e.op === TST.BinaryOp.LessEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.OLE, e1, e2)
        : functionBuilder.icmp(IR.IP.SLE, e1, e2);
    } else if (e.op === TST.BinaryOp.GreaterThan) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.OGT, e1, e2)
        : functionBuilder.icmp(IR.IP.SGT, e1, e2);
    } else if (e.op === TST.BinaryOp.GreaterEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IR.FP.OGE, e1, e2)
        : functionBuilder.icmp(IR.IP.SGE, e1, e2);
    } else if (e.op === TST.BinaryOp.Plus) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fadd(e1, e2)
        : functionBuilder.add(e1, e2);
    } else if (e.op === TST.BinaryOp.Minus) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fsub(e1, e2)
        : functionBuilder.sub(e1, e2);
    } else if (e.op === TST.BinaryOp.Times) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fmul(e1, e2)
        : functionBuilder.mul(e1, e2);
    } else if (e.op === TST.BinaryOp.Divide) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fdiv(e1, e2)
        : functionBuilder.sdiv(e1, e2);
    }

    throw Error(`TODO: e: ${e.tag}: ${JSON.stringify(e, null, 2)}`);
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
