import * as TST from "../dynamic/tst.ts";
import * as IR from "./llvm/ir.ts";
import * as Builders from "./llvm/builders.ts";

export const compile = (tst: TST.Program): IR.Module => {
  const moduleBuilder = Builders.module("p0");

  moduleBuilder
    .declareExternal("_print_bool", [IR.i8], IR.voidType)
    .declareExternal("_print_int", [IR.i32], IR.voidType)
    .declareExternal("_print_string", [IR.i8], IR.voidType)
    .declareExternal("_print_float", [IR.pointerType(IR.floatFP)], IR.voidType)
    .declareExternal("_print_ln", [], IR.voidType);

  compileMain(tst, moduleBuilder);

  return moduleBuilder.build();
};

const compileMain = (
  tst: TST.Program,
  moduleBuilder: Builders.ModuleBuilder,
) => {
  const functionBuilder = moduleBuilder.declareFunction("main", [], IR.i32);

  //   compileS(tst);

  functionBuilder.ret({ tag: "CInt", bits: 32, value: 0 });
  functionBuilder.build();
};
