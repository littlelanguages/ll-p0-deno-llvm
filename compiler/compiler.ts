import * as TST from "../dynamic/tst.ts";
import * as IROperand from "./llvm/ir/operand.ts";
import * as IRModule from "./llvm/ir/module.ts";
import * as IRInstruction from "./llvm/ir/instruction.ts";
import * as IRType from "./llvm/ir/type.ts";
import * as Builders from "./llvm/builders.ts";

export const compile = (
  tst: TST.Program,
  name: string = "p0",
): IRModule.Module => {
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
      operand: function (name: string): IROperand.Operand {
        for (let lp = this.operands.length - 1; lp >= 0; lp -= 1) {
          const potentialResult = this.operands[lp].get(name);
          if (potentialResult !== undefined) {
            return potentialResult;
          }
        }
        throw new Error(`Internal Error: operand: ${name}`);
      },
      registerOperand: function (name: string, op: IROperand.Operand) {
        this.operands[this.operands.length - 1].set(name, op);
      },
    },
  );

  moduleBuilder
    .declareExternal("@_print_bool", [IRType.i8], IRType.voidType)
    .declareExternal("@_print_int", [IRType.i32], IRType.voidType)
    .declareExternal(
      "@_print_string",
      [IRType.pointerType(IRType.i8)],
      IRType.voidType,
    )
    .declareExternal("@_print_float", [IRType.floatFP], IRType.voidType)
    .declareExternal("@_print_ln", [], IRType.voidType);

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
    const ps: Array<[string, IRType.Type]> = d.ps.map((
      p,
    ) => [p.n, toType(p.t)]);

    const functionBuilder = declareFunction(
      `@${d.n}`,
      ps,
      d.e === undefined ? IRType.voidType : toType(typeOf(d.e)),
      moduleBuilder,
    );

    functionBuilder.openScope();
    ps.forEach((p, index) => {
      const op = functionBuilder.alloca(p[1]);
      functionBuilder.store(op, IROperand.localReference(p[1], `%${p[0]}`));
      functionBuilder.registerOperand(p[0], op);
    });

    compileSS(d.ss, functionBuilder);

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
    const v: IROperand.Constant = (d.e.tag === "LiteralInt")
      ? IROperand.cint(32, d.e.v)
      : (d.e.tag === "LiteralBool")
      ? IROperand.cint(1, d.e.v ? 1 : 0)
      : (d.e.tag === "LiteralFloat")
      ? IROperand.cfloatFP(d.e.v)
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
      IROperand.cglobalReference(IRType.pointerType(type), `@${d.identifier}`),
    );
  }
};

const compileMain = (
  tst: TST.Program,
  moduleBuilder: ModuleBuilder,
) => {
  const functionBuilder = declareFunction(
    "@main",
    [],
    IRType.i32,
    moduleBuilder,
  );

  compileS(tst.s, functionBuilder);

  functionBuilder.ret(IROperand.cint(32, 0));
  functionBuilder.build();
};

const compileSS = (
  ss: Array<TST.Statement>,
  functionBuilder: FunctionBuilder,
) => {
  ss.forEach((s) => compileS(s, functionBuilder));
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
    const op = functionBuilder.alloca(IROperand.typeOf(e));
    functionBuilder.store(op, e);
    functionBuilder.registerOperand(s.n, op);
  } else if (s.tag === "AssignmentStatement") {
    const e = compileE(s.e, functionBuilder);
    const op = functionBuilder.operand(s.n);
    functionBuilder.store(op, e);
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
    functionBuilder.openScope();
    compileSS(s.ss, functionBuilder);
    functionBuilder.closeScope();
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
      [et === TST.Type.Bool ? functionBuilder.zext(IRType.i8, eo) : eo],
    );
  });
};

const compileE = (
  e: TST.Expression,
  functionBuilder: FunctionBuilder,
): IROperand.Operand => {
  if (e.tag === "LiteralInt") {
    return IROperand.cint(32, e.v);
  } else if (e.tag === "LiteralBool") {
    return IROperand.cint(1, e.v ? 1 : 0);
  } else if (e.tag === "LiteralFloat") {
    return { tag: "CFloatFP", value: e.v };
  } else if (e.tag === "LiteralString") {
    let op = functionBuilder.strings.get(e.v);

    if (op === undefined) {
      const name = `@_${functionBuilder.strings.size}.str`;

      functionBuilder.declareGlobal(
        name,
        IRType.arrayType(e.v.length + 1, IRType.i8),
        true,
        {
          tag: "CArray",
          memberType: IRType.i8,
          values: [...e.v.split("").map((c) => c.charCodeAt(0)), 0].map((c) =>
            IROperand.cint(8, c)
          ),
        },
      );
      op = {
        tag: "CGlobalReference",
        type: IRType.pointerType(IRType.arrayType(e.v.length + 1, IRType.i8)),
        name: name,
      };

      functionBuilder.strings.set(name, op);
    }

    return functionBuilder.getElementPointer(
      true,
      IRType.pointerType(IRType.i8),
      IRType.arrayType(e.v.length + 1, IRType.i8),
      op,
      [IROperand.cint(32, 0), IROperand.cint(32, 0)],
    );
  } else if (e.tag === "UnaryExpression") {
    const op = compileE(e.e, functionBuilder);

    if (e.op === TST.UnaryOp.UnaryPlus) {
      return op;
    } else if (e.op === TST.UnaryOp.UnaryMinus) {
      if (typeOf(e.e) === TST.Type.Float) {
        return functionBuilder.fsub(IROperand.cfloatFP(0.0), op);
      } else {
        return functionBuilder.sub(IROperand.cint(32, 0), op);
      }
    } else {
      return functionBuilder.xor(op, IROperand.cint(1, 1));
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
        ? functionBuilder.fcmp(IRInstruction.FP.OEQ, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.EQ, e1, e2);
    } else if (e.op === TST.BinaryOp.NotEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IRInstruction.FP.ONE, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.NQ, e1, e2);
    } else if (e.op === TST.BinaryOp.LessThan) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IRInstruction.FP.OLT, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.SLT, e1, e2);
    } else if (e.op === TST.BinaryOp.LessEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IRInstruction.FP.OLE, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.SLE, e1, e2);
    } else if (e.op === TST.BinaryOp.GreaterThan) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IRInstruction.FP.OGT, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.SGT, e1, e2);
    } else if (e.op === TST.BinaryOp.GreaterEqual) {
      return (typeOf(e.e1) === TST.Type.Float)
        ? functionBuilder.fcmp(IRInstruction.FP.OGE, e1, e2)
        : functionBuilder.icmp(IRInstruction.IP.SGE, e1, e2);
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
    return functionBuilder.load(toType(e.t), op);
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

const toType = (t: TST.Type): IRType.Type =>
  t === TST.Type.Bool
    ? IRType.i1
    : t === TST.Type.Float
    ? IRType.floatFP
    : t === TST.Type.Int
    ? IRType.i32
    : t === TST.Type.String
    ? IRType.pointerType(IRType.i8)
    : IRType.i32;

interface CodegenState {
  operands: Array<Map<string, IROperand.Operand>>;
  strings: Map<string, IROperand.Operand>;

  openScope: () => void;
  closeScope: () => void;
  operand: (name: string) => IROperand.Operand;
  registerOperand: (name: string, op: IROperand.Operand) => void;
}

type ModuleBuilder = Builders.ModuleBuilder & CodegenState;
type FunctionBuilder = Builders.FunctionBuilder & CodegenState;

const declareFunction = (
  name: string,
  args: Array<[string, IRType.Type]>,
  result: IRType.Type,
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
      registerOperand: (name: string, op: IROperand.Operand) =>
        moduleBuilder.registerOperand(name, op),
    },
  );
