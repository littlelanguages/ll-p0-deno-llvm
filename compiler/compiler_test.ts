import { readYaml } from "../deps/garn_yaml.ts";
import { translate } from "../dynamic/translate.ts";
import * as IR from "./llvm/ir.ts";
import * as Tools from "./llvm/tools.ts";
import { IExecResponse } from "../deps/exec.ts";

import { assertEquals, fail } from "../deps/asserts.ts";
import { compile } from "./compiler.ts";

const testAll = (content: any): Promise<any> => {
  const testItem = async (content: any, path: Array<string>): Promise<any> => {
    if (Array.isArray(content)) {
      return Promise.all(content.map((t) => testItem(t, path)));
    } else if (content.scenario !== undefined) {
      return testItem(content.scenario.tests, [...path, content.scenario.name]);
    } else {
      try {
        await translate(content.input).either(
          (es) => Promise.resolve(),
          (tst) => {
            const module = compile(tst);

            return Tools.write(module, "./tests/test.ll");
          },
        );

        await run(Tools.assemble("./tests/test.ll", "./tests/test.o"));
        await run(
          Tools.link(["./tests/test.o", "./tests/p0lib.o"], "./tests/test.bc"),
        );
        const result = await run(Tools.run("./tests/test.bc", []));

        assertEquals(
          result.output,
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
    return Promise.all(content.map(testAll));
  } else {
    return testItem(content, []);
  }
};

const runTests = async () => {
  await run(Tools.compile("./tests/p0lib.c", "./tests/p0lib.o"));

  const content = await readYaml("./compiler/semantics.yaml");

  return testAll(content);
};

const run = async (
  cmdResult: Promise<IExecResponse>,
): Promise<IExecResponse> => {
  const r = await cmdResult;

  if (r.status.code !== 0) {
    throw Error(JSON.stringify(r, null, 2));
  }

  return r;
};

Deno.test("compile", async () => await runTests());
