import { readYaml } from "https://deno.land/x/garn_yaml@0.2.1/mod.ts";

import { assertEquals } from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { mkScanner, TToken } from "./grammar-scanner.ts";
import { Location } from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";
import { parse } from "./parser.ts";

const testAll = (content: any) => {
  const testItem = (content: any, path: Array<string>) => {
    if (Array.isArray(content)) {
      content.forEach((t) => testItem(t, path));
    } else if (content.scenario !== undefined) {
      testItem(content.scenario.tests, [...path, content.scenario.name]);
    } else {
      const ast = parse(content.input);

      assertEquals(
        // content.output,
        true,
        ast.either((_) => false, (_) => true),
        // [...path, content.name].join(":"),
      );
    }
  };

  if (Array.isArray(content)) {
    content.forEach(testAll);
  } else {
    testItem(content, []);
  }
};

const runTests = async () => {
  const content = await readYaml("./static/parser.yaml");

  testAll(content);
};

Deno.test("grammar-parser", async () => runTests());
