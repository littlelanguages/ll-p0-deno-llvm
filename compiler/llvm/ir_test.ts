import { assertEquals } from "../../deps/asserts.ts";
import {
  arrayType,
  doubleFP,
  floatFP,
  functionType,
  halfFP,
  i1,
  i128,
  i16,
  i32,
  i64,
  i8,
  integerType,
  pointerType,
  structureType,
  Type,
  typeToString,
  voidType,
} from "./ir.ts";

Deno.test("typeToString", () => {
  assertType(voidType, "void");
  assertType(i1, "i1");
  assertType(pointerType(i8), "i8*");
  assertType(halfFP, "half");
  assertType(floatFP, "float");
  assertType(doubleFP, "double");

  assertType(functionType(i32, [i32]), "i32 (i32)");
  assertType(pointerType(functionType(i16, [pointerType(i32)])), "i16 (i32*)*");
  assertType(functionType(i32, [pointerType(i8)], true), "i32 (i8*, ...)");

  assertType(structureType([i32, i64, i128]), "{ i32, i64, i128 }");
  assertType(structureType([i32, i64, i128], true), "<{ i32, i64, i128 }>");

  assertType(arrayType(40, integerType(256)), "[40 x i256]");
});

const assertType = (type: Type, text: string) => {
  assertEquals(typeToString(type), text);
};
