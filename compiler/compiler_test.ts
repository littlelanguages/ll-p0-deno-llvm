import { readYaml } from "../deps/garn_yaml.ts";
import { translate } from "../dynamic/translate.ts";
import * as Tools from "./llvm/tools.ts";
import { IExecResponse } from "../deps/exec.ts";

import { compile } from "./compiler.ts";

const testAll = (content: any): Promise<any> =>
  (Array.isArray(content))
    ? content.reduce(
      (token, test) => token.then(() => testAll(test)),
      Promise.resolve(),
    )
    : testItem(content, []);

const testItem = (content: any, path: Array<string>): Promise<any> =>
  (Array.isArray(content))
    ? content.reduce(
      (token, test) => token.then(() => testItem(test, path)),
      Promise.resolve(),
    )
    : (content.scenario !== undefined)
    ? testItem(content.scenario.tests, [...path, content.scenario.name])
    : translate(content.input)
      .either(
        () => Promise.resolve(),
        (tst) => {
          const module = compile(tst);

          return Tools.write(module, "./tests/test.ll");
        },
      )
      .then(() => run(Tools.assemble("./tests/test.ll", "./tests/test.o")))
      .then(() =>
        run(
          Tools.link(
            ["./tests/test.o", "./tests/p0lib.o"],
            "./tests/test.bc",
          ),
        )
      )
      .then(() => run(Tools.run("./tests/test.bc", [])))
      .then((result) =>
        result.output.trim() === content.output.trim()
          ? Promise.resolve()
          : Promise.reject(
            [...path, content.name].join(":") + ": [" + result.output.trim() +
              "] " +
              content.output.trim() + "]",
          )
      );

const runTests = (): Promise<any> =>
  run(Tools.compile("./tests/p0lib.c", "./tests/p0lib.o"))
    .then(() => readYaml("./compiler/semantics.yaml"))
    .then((content) => testAll(content));

const run = (cmdResult: Promise<IExecResponse>): Promise<IExecResponse> =>
  cmdResult.then((r) =>
    (r.status.code === 0) ? Promise.resolve(r) : Promise.reject(r)
  );

Deno.test("compile", async () => await runTests());
