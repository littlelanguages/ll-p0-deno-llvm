import { readYaml } from "../deps/garn_yaml.ts";
import { translate } from "../dynamic/translate.ts";
import * as Tools from "./llvm/tools.ts";
import { IExecResponse } from "../deps/exec.ts";
import { assertEquals, fail } from "../deps/asserts.ts";

import { compile } from "./compiler.ts";

type TestItem = {
  name: string;
  input: string;
  output: string;
};

const serialize = (content: any): Array<TestItem> =>
  (Array.isArray(content))
    ? content.flatMap(serialize)
    : serializeItem(content, []);

const serializeItem = (
  content: any,
  path: Array<string>,
): Array<TestItem> =>
  (Array.isArray(content))
    ? content.flatMap((i) => serializeItem(i, path))
    : (content.scenario !== undefined)
    ? serializeItem(content.scenario.tests, [...path, content.scenario.name])
    : [
      {
        name: [...path, content.name].join(":"),
        input: content.input,
        output: content.output,
      },
    ];

const runTestItem = (testItem: TestItem, index: number): Promise<void> => {
  const name = `test_${index}`;

  return translate(testItem.input)
    .either(
      (e) => Promise.reject(e),
      (tst) => {
        try {
          return Tools.write(compile(tst, testItem.name), `./tests/${name}.ll`);
        } catch (e) {
          console.log(`>>>>>>>>>>>>>> ${e}`);
          return Promise.reject(e);
        }
      },
    )
    .then(() => run(Tools.assemble(`./tests/${name}.ll`, `./tests/${name}.o`)))
    .then(() =>
      run(
        Tools.link(
          [`./tests/${name}.o`, "./tests/p0lib.o"],
          `./tests/${name}.bc`,
        ),
      )
    )
    .then(() => run(Tools.run(`./tests/${name}.bc`, [])))
    .then((result) => assertEquals(result.output.trim(), testItem.output.trim()) // ? Promise.resolve()
      // : Promise.reject(
      //   testItem.name + ": [" + result.output.trim() +
      //     "] " +
      //     testItem.output.trim() + "]",
      // )
    )
    // .catch((r) => {
    // console.log(
    //   `***************** ${testItem.name} ${JSON.stringify(r, null, 2)}`,
    // );
    // return fail(JSON.stringify(testItem, null, 2));
    // })
    .then((_) => Promise.resolve());
};

const runTests = (): Promise<any> =>
  run(Tools.compile("./tests/p0lib.c", "./tests/p0lib.o"))
    .then(() => readYaml("./compiler/semantics.yaml"))
    .then((content) =>
      Promise.all(
        serialize(content).map((testItem, index) =>
          runTestItem(testItem, index)
        ),
      )
    );

const run = (cmdResult: Promise<IExecResponse>): Promise<IExecResponse> =>
  cmdResult.then((r) =>
    (r.status.code === 0) ? Promise.resolve(r) : Promise.reject(r)
  );

Deno.test("compile", async (): Promise<any> => await runTests());
