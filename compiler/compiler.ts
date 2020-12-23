import * as TST from "../dynamic/tst.ts";
import * as IR from "./llvm/ir.ts";
import * as Builders from "./llvm/builders.ts";

export const compile = (tst: TST.Program, name: string = "p0"): IR.Module => {
  const moduleBuilder = Object.assign(
    Builders.module(name),
    {
      operands: [new Map()],
      strings: new Map(),

      openScope: function () {
        this.operands.push(new Map());
      },
      closeScope: function () {
        this.operands.pop();
      },
      operand: function (name: string): IR.Operand {
        for (let lp = this.operands.length - 1; lp >= 0; lp -= 1) {
          const potentialResult = this.operands[lp].get(name);
          if (potentialResult !== undefined) {
            return potentialResult;
          }
        }
        throw new Error(`Internal Error: operand: ${name}`);
      },
      registerOperand: function (name: string, op: IR.Operand) {
        this.operands[this.operands.length - 1].set(name, op);
      },
    },
  );

  moduleBuilder
    .declareExternal("@_print_bool", [IR.i8], IR.voidType)
    .declareExternal("@_print_int", [IR.i32], IR.voidType)
    .declareExternal("@_print_string", [IR.pointerType(IR.i8)], IR.voidType)
    .declareExternal("@_print_float", [IR.floatFP], IR.voidType)
    .declareExternal("@_print_ln", [], IR.voidType);

  compileDS(tst.d, moduleBuilder);

  compileMain(tst, moduleBuilder);

  return moduleBuilder.build();
};

const compileDS = (
  ds: Array<TST.Declaration>,
  moduleBuilder: ModuleBuilder,
) => ds.forEach((d) => compileD(d, moduleBuilder));

const compileD = (
  d: TST.Declaration,
  moduleBuilder: ModuleBuilder,
) => {
  if (d.tag === "FunctionDeclaration") {
    const ps: Array<[string, IR.Type]> = d.ps.map((p) => [p.n, toType(p.t)]);

    const functionBuilder = declareFunction(
      `@${d.n}`,
      ps,
      d.e === undefined ? IR.voidType : toType(typeOf(d.e)),
      moduleBuilder,
    );

    functionBuilder.openScope();
    ps.forEach((p, index) => {
      const op = functionBuilder.alloca(p[1], undefined);
      functionBuilder.store(
        op,
        undefined,
        { tag: "LocalReference", type: p[1], name: `%${p[0]}` },
      );
      functionBuilder.registerOperand(p[0], op);
    });

    d.ss.forEach((s) => compileS(s, functionBuilder));

    if (d.e === undefined) {
      functionBuilder.retvoid();
    } else {
      const op = compileE(d.e, functionBuilder);
      functionBuilder.ret(op);
    }
    functionBuilder.closeScope();
    functionBuilder.build();
  } else if (
    d.tag === "ConstantDeclaration" || d.tag === "VariableDeclaration"
  ) {
    const v: IR.Constant = (d.e.tag === "LiteralInt")
      ? { tag: "CInt", bits: 32, value: d.e.v }
      : (d.e.tag === "LiteralBool")
      ? { tag: "CInt", bits: 1, value: d.e.v ? 1 : 0 }
      : (d.e.tag === "LiteralFloat")
      ? { tag: "CFloatFP", value: d.e.v }
      : (() => {
        throw new Error(
          `Internal Error: declaration: ${d.tag}: ${
            JSON.stringify(d, null, 2)
          }`,
        );
      })();

    const type = toType(typeOf(d.e));

    moduleBuilder.declareGlobal(`@${d.identifier}`, type, false, v);
    moduleBuilder.registerOperand(
      d.identifier,
      {
        tag: "CGlobalReference",
        type: IR.pointerType(type),
        name: `@${d.identifier}`,
      },
    );
  }
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

const compileSS = (
  ss: Array<TST.Statement>,
  functionBuilder: FunctionBuilder,
) => {
  functionBuilder.openScope();
  ss.forEach((s) => compileS(s, functionBuilder));
  functionBuilder.closeScope();
};

const compileS = (
  s: TST.Statement,
  functionBuilder: FunctionBuilder,
) => {
  if (
    s.tag === "ConstantDeclarationStatement" ||
    s.tag === "VariableDeclarationStatement"
  ) {
    const e = compileE(s.e, functionBuilder);
    const op = functionBuilder.alloca(IR.typeOf(e), undefined);
    functionBuilder.store(op, undefined, e);
    functionBuilder.registerOperand(s.n, op);
  } else if (s.tag === "AssignmentStatement") {
    const e = compileE(s.e, functionBuilder);
    const op = functionBuilder.operand(s.n);
    functionBuilder.store(op, undefined, e);
  } else if (s.tag === "IfThenElseStatement") {
    if (s.s2 === undefined) {
      const thenBlock = functionBuilder.newLabel("then");
      const mergeBlock = functionBuilder.newLabel("merge");

      const e = compileE(s.e, functionBuilder);

      functionBuilder.condBr(e, thenBlock, mergeBlock);

      functionBuilder.label(thenBlock);
      compileS(s.s1, functionBuilder);
      functionBuilder.br(mergeBlock);

      functionBuilder.label(mergeBlock);
    } else {
      const thenBlock = functionBuilder.newLabel("then");
      const elseBlock = functionBuilder.newLabel("else");
      const mergeBlock = functionBuilder.newLabel("merge");

      const e = compileE(s.e, functionBuilder);

      functionBuilder.condBr(e, thenBlock, elseBlock);

      functionBuilder.label(thenBlock);
      compileS(s.s1, functionBuilder);
      functionBuilder.br(mergeBlock);

      functionBuilder.label(elseBlock);
      compileS(s.s2, functionBuilder);
      functionBuilder.br(mergeBlock);

      functionBuilder.label(mergeBlock);
    }
  } else if (s.tag === "WhileStatement") {
    const whileBlock = functionBuilder.newLabel("while");
    const bodyBlock = functionBuilder.newLabel("body");
    const mergeBlock = functionBuilder.newLabel("merge");

    functionBuilder.br(whileBlock);
    functionBuilder.label(whileBlock);
    const e = compileE(s.e, functionBuilder);

    functionBuilder.condBr(e, bodyBlock, mergeBlock);

    functionBuilder.label(bodyBlock);
    compileS(s.s, functionBuilder);
    functionBuilder.br(whileBlock);

    functionBuilder.label(mergeBlock);
  } else if (s.tag === "BlockStatement") {
    compileSS(s.ss, functionBuilder);
  } else if (s.tag === "CallStatement") {
    if (s.n === "print") {
      compilePrintStatement(s, functionBuilder);
    } else if (s.n === "println") {
      compilePrintStatement(s, functionBuilder);
      functionBuilder.callvoid("@_print_ln", []);
    } else {
      functionBuilder.callvoid(
        `@${s.n}`,
        s.args.map((e) => compileE(e, functionBuilder)),
      );
    }
  }
};

const compilePrintStatement = (
  s: TST.CallStatement,
  functionBuilder: FunctionBuilder,
) => {
  s.args.forEach((e) => {
    const et = typeOf(e);
    const eo = compileE(e, functionBuilder);
    const name = et ===
        TST.Type.Bool
      ? "@_print_bool"
      : et === TST.Type.Int
      ? "@_print_int"
      : et === TST.Type.String
      ? "@_print_string"
      : "@_print_float";

    functionBuilder.callvoid(
      name,
      [et === TST.Type.Bool ? functionBuilder.zext(IR.i8, eo) : eo],
    );
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
  } else if (e.tag === "LiteralFloat") {
    return { tag: "CFloatFP", value: e.v };
  } else if (e.tag === "LiteralString") {
    let op = functionBuilder.strings.get(e.v);

    if (op === undefined) {
      const name = `@_${functionBuilder.strings.size}.str`;

      functionBuilder.declareGlobal(
        name,
        IR.arrayType(e.v.length + 1, IR.i8),
        true,
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

    return functionBuilder.getElementPointer(
      true,
      IR.pointerType(IR.i8),
      IR.arrayType(e.v.length + 1, IR.i8),
      op,
      [
        { tag: "CInt", bits: 32, value: 0 },
        { tag: "CInt", bits: 32, value: 0 },
      ],
    );
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
    } else {
      return functionBuilder.xor(op, { tag: "CInt", bits: 1, value: 1 });
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
    } /* (e.op === TST.BinaryOp.Divide)*/
    {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fdiv(e1, e2)
        : functionBuilder.sdiv(e1, e2);
    }
  } else if (e.tag === "IdentifierReference") {
    const op = functionBuilder.operand(e.n);
    return functionBuilder.load(toType(e.t), op, undefined);
  } /* (e.tag === "CallExpression")*/ else {
    return functionBuilder.call(
      `@${e.n}`,
      toType(e.t),
      e.args.map((e) => compileE(e, functionBuilder)),
    );
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

const toType = (t: TST.Type): IR.Type =>
  t === TST.Type.Bool
    ? IR.i1
    : t === TST.Type.Float
    ? IR.floatFP
    : t === TST.Type.Int
    ? IR.i32
    : t === TST.Type.String
    ? IR.pointerType(IR.i8)
    : IR.i32;

interface CodegenState {
  operands: Array<Map<string, IR.Operand>>;
  strings: Map<string, IR.Operand>;

  openScope: () => void;
  closeScope: () => void;
  operand: (name: string) => IR.Operand;
  registerOperand: (name: string, op: IR.Operand) => void;
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
    {
      operands: moduleBuilder.operands,
      strings: moduleBuilder.strings,

      openScope: () => moduleBuilder.openScope(),
      closeScope: () => moduleBuilder.closeScope(),
      operand: (name: string) => moduleBuilder.operand(name),
      registerOperand: (name: string, op: IR.Operand) =>
        moduleBuilder.registerOperand(name, op),
    },
  );
