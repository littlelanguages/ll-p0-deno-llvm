import { readYaml } from "https://deno.land/x/garn_yaml@0.2.1/mod.ts";

import { assertEquals } from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { mkScanner, TToken } from "./grammar-scanner.ts";
import { Location } from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";

const testAll = (content: any) => {
  const testItem = (content: any, path: Array<string>) => {
    if (Array.isArray(content)) {
      content.forEach((t) => testItem(t, path));
    } else if (content.scenario !== undefined) {
      testItem(content.scenario.tests, [...path, content.scenario.name]);
    } else {
      const scanner = mkScanner(content.input);
      const tokens = [];

      while (scanner.current()[0] !== TToken.EOS) {
        tokens.push(scanner.current());
        scanner.next();
      }
      tokens.push(scanner.current());

      assertEquals(
        content.output,
        tokens.map((t) =>
          `${ttokenToString(t[0])} ${toString(t[1])} [${t[2]}]`
        ),
        [...path, content.name].join(":"),
      );
    }
  };

  if (Array.isArray(content)) {
    content.forEach(testAll);
  } else {
    testItem(content, []);
  }
};

export const toString = (
  location: Location,
): string =>
  location.tag == "Coordinate"
    ? `${location.offset}:${location.line}:${location.column}`
    : `${location.start.offset}:${location.start.line}:${location.start.column}-${location.end.offset}:${location.end.line}:${location.end.column}`;

const ttokenToString = (ttoken: TToken): string =>
  [
    "Bang",
    "Slash",
    "Star",
    "GreaterThan",
    "GreaterThanEqual",
    "LessThan",
    "LessThanEqual",
    "BangEqual",
    "EqualEqual",
    "AmpersandAmpersand",
    "BarBar",
    "Question",
    "While",
    "Else",
    "If",
    "Bool",
    "Float",
    "Int",
    "RCurly",
    "Return",
    "LCurly",
    "Colon",
    "RParen",
    "Comma",
    "LParen",
    "Fun",
    "Dash",
    "Plus",
    "False",
    "True",
    "Semicolon",
    "Equal",
    "Let",
    "Const",
    "Identifier",
    "LiteralInt",
    "LiteralFloat",
    "LiteralString",
    "EOS",
    "ERROR",
  ][ttoken];

const runTests = async () => {
  const content = await readYaml("./static/lexical.yaml");

  testAll(content);
};

Deno.test("grammar-scanner", async () => runTests());
