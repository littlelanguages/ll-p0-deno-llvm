import { readYaml } from "https://deno.land/x/garn_yaml@0.2.1/mod.ts";

import {
  assertEquals,
  fail,
} from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { translate, typeOf } from "./translate.ts";
import { BinaryOp, Type, UnaryOp } from "./tst.ts";

const testAll = (content: any) => {
  const testItem = (content: any, path: Array<string>) => {
    if (Array.isArray(content)) {
      content.forEach((t) => testItem(t, path));
    } else if (content.scenario !== undefined) {
      testItem(content.scenario.tests, [...path, content.scenario.name]);
    } else {
      try {
        const tst = translate(content.input).either(toYaml, toYaml);

        assertEquals(
          tst,
          content.output,
          //   [...path, content.name].join(":") + ": " +
          //     JSON.stringify(tst, null, 2),
        );
      } catch (e) {
        fail(
          [...path, content.name].join(":") + ": " +
            JSON.stringify(content.input, null, 2) + ": " + e,
        );
      }
    }
  };

  if (Array.isArray(content)) {
    content.forEach(testAll);
  } else {
    testItem(content, []);
  }
};

const runTests = async () => {
  const content = await readYaml("./dynamic/dynamic.yaml");

  testAll(content);
};

Deno.test("translate", async () => runTests());

const toYaml = (
  tst: any,
): any => {
  if (tst === undefined) {
    return "UNDEFINED";
  } else if (Array.isArray(tst)) {
    return tst.map(toYaml);
  } else if (tst.tag === "LiteralString") {
    return { LiteralString: tst.v };
  } else if (tst.tag === "LiteralBool") {
    return { LiteralBool: tst.v ? "True" : "False" };
  } else if (tst.tag === "LiteralInt") {
    return { LiteralInt: `${tst.v}` };
  } else if (tst.tag === "LiteralFloat") {
    let v = `${tst.v}`;
    if (v.indexOf(".") === -1) {
      v = v + ".0";
    }

    return { LiteralFloat: v };
  } else if (tst.tag === "TernaryExpression") {
    return {
      TernaryExpression: {
        t: Type[typeOf(tst.e2)],
        e1: toYaml(tst.e1),
        e2: toYaml(tst.e2),
        e3: toYaml(tst.e3),
      },
    };
  } else if (tst.tag === "BinaryExpression") {
    return {
      BinaryExpression: {
        t: Type[typeOf(tst)],
        e1: toYaml(tst.e1),
        e2: toYaml(tst.e2),
        op: BinaryOp[tst.op],
      },
    };
  } else if (tst.tag === "UnaryExpression") {
    return {
      UnaryExpression: {
        t: Type[typeOf(tst)],
        e: toYaml(tst.e),
        op: UnaryOp[tst.op],
      },
    };
  } else if (tst.tag === "Parameter") {
    return { n: tst.n, t: Type[tst.t] };
  } else if (tst.tag === "UnaryExpressionRequiresOperandTypeError") {
    return {
      UnaryExpressionRequiresOperandTypeError: {
        type: Type[tst.type],
        location: toYaml(tst.location),
        op: UnaryOp[tst.op],
      },
    };
  } else if (tst.tag === "BlockStatement") {
    return { BlockStatement: toYaml(tst.ss) };
  } else if (tst.tag === "Coordinate") {
    return `${tst.offset}:${tst.line}:${tst.column}`;
  } else if (tst.tag === "Range") {
    return `${tst.start.offset}:${tst.start.line}:${tst.start.column}-${tst.end.offset}:${tst.end.line}:${tst.end.column}`;
  } else if (tst.tag === undefined) {
    return tst;
  } else {
    const result: any = {};
    const body: any = {};

    Object.getOwnPropertyNames(tst).filter((n) => n !== "tag").forEach((n) => {
      if (n === "op") {
        body[n] = BinaryOp[tst[n]];
      } else if (n.endsWith("Type") || n.startsWith("type") || n === "t") {
        body[n] = Type[tst[n]];
      } else if (tst[n] !== undefined) {
        body[n] = toYaml(tst[n]);
      }
    });
    result[tst.tag] = body;

    return result;
  }
};
