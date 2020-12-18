import { readYaml } from "../deps/garn_yaml.ts";

import { assertEquals } from "../deps/asserts.ts";
import { Location } from "../deps/location.ts";
import { parse } from "./parser.ts";
import {
  BinaryOp,
  Declaration,
  Expression,
  Identifier,
  LiteralExpression,
  Program,
  Statement,
  Type,
  UnaryOp,
  VariableAccess,
} from "./ast.ts";

const testAll = (content: any) => {
  const testItem = (content: any, path: Array<string>) => {
    if (Array.isArray(content)) {
      content.forEach((t) => testItem(t, path));
    } else if (content.scenario !== undefined) {
      testItem(content.scenario.tests, [...path, content.scenario.name]);
    } else {
      const ast: Program = parse(content.input).either(
        (_) => ({ tag: "Program", declarations: [] }),
        (r) => r,
      );

      assertEquals(
        content.output,
        toYaml(ast),
        [...path, content.name].join(":") + ": " +
          JSON.stringify(content.output, null, 2),
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

const toYaml = (
  ast:
    | Program
    | Declaration
    | Statement
    | Expression
    | LiteralExpression
    | Identifier
    | Location,
): any =>
  ast.tag === "Program"
    ? { Program: ast.declarations.map(toYaml) }
    : ast.tag === "VariableDeclaration"
    ? {
      VariableDeclaration: {
        access: VariableAccess[ast.access],
        identifier: toYaml(ast.identifier),
        e: toYaml(ast.expression),
      },
    }
    : ast.tag === "FunctionDeclaration"
    ? {
      FunctionDeclaration: Object.assign(
        {
          identifier: toYaml(ast.identifier),
          arguments: ast.arguments.map(([i, t]) => ({
            name: toYaml(i),
            type: Type[t],
          })),
          s: ast.statements.map(toYaml),
        },
        ast.suffix === undefined
          ? {}
          : { e: toYaml(ast.suffix[1]), result: Type[ast.suffix[0]] },
      ),
    }
    : ast.tag === "AssignmentStatement"
    ? {
      AssignmentStatement: {
        identifier: toYaml(ast.identifier),
        e: toYaml(ast.expression),
      },
    }
    : ast.tag === "DeclarationStatement"
    ? {
      VariableDeclarationStatement: {
        access: VariableAccess[ast.access],
        identifier: toYaml(ast.identifier),
        e: toYaml(ast.expression),
      },
    }
    : ast.tag === "IfThenElseStatement"
    ? {
      IfThenElseStatement: Object.assign(
        {
          e: toYaml(ast.expression),
          s1: toYaml(ast.statement1),
        },
        ast.statement2 === undefined ? {} : { s2: toYaml(ast.statement2) },
      ),
    }
    : ast.tag === "WhileStatement"
    ? {
      WhileStatement: {
        e: toYaml(ast.expression),
        s: toYaml(ast.statement),
      },
    }
    : ast.tag === "BlockStatement"
    ? {
      BlockStatement: ast.statements.map(toYaml),
    }
    : ast.tag === "CallStatement"
    ? {
      CallStatement: {
        identifier: toYaml(ast.identifier),
        parameters: ast.expressions.map(toYaml),
      },
    }
    : ast.tag === "EmptyStatement"
    ? {
      EmptyStatement: {},
    }
    : ast.tag === "TernaryExpression"
    ? {
      TernaryExpression: {
        e1: toYaml(ast.expression1),
        e2: toYaml(ast.expression2),
        e3: toYaml(ast.expression3),
      },
    }
    : ast.tag === "BinaryExpression"
    ? {
      BinaryExpression: {
        e1: toYaml(ast.expression1),
        op: BinaryOp[ast.op],
        e2: toYaml(ast.expression2),
      },
    }
    : ast.tag === "UnaryExpression"
    ? {
      UnaryExpression: {
        position: toYaml(ast.location),
        op: UnaryOp[ast.op],
        e: toYaml(ast.expression),
      },
    }
    : ast.tag === "CallExpression"
    ? {
      CallExpression: {
        name: toYaml(ast.identifier),
        parameters: ast.expressions.map(toYaml),
      },
    }
    : ast.tag === "IdentifierReference"
    ? {
      IdentifierReference: toYaml(ast.identifier),
    }
    : ast.tag === "Parenthesis"
    ? {
      Parenthesis: {
        e: toYaml(ast.expression),
        position: toYaml(ast.location),
      },
    }
    : ast.tag === "LiteralExpressionUnaryValue"
    ? {
      LiteralExpressionUnaryValue: {
        position: toYaml(ast.location),
        op: UnaryOp[ast.op],
        value: toYaml(ast.value),
      },
    }
    : ast.tag === "LiteralInt"
    ? { LiteralInt: { value: ast.value, position: toYaml(ast.location) } }
    : ast.tag === "LiteralString"
    ? { LiteralString: { value: ast.value, position: toYaml(ast.location) } }
    : ast.tag === "LiteralFloat"
    ? { LiteralFloat: { value: ast.value, position: toYaml(ast.location) } }
    : ast.tag === "LiteralBool"
    ? {
      LiteralBool: {
        value: ast.value ? "True" : "False",
        position: toYaml(ast.location),
      },
    }
    : ast.tag === "Identifier"
    ? { value: ast.name, position: toYaml(ast.location) }
    : ast.tag === "Coordinate"
    ? `${ast.offset}:${ast.line}:${ast.column}`
    : ast.tag === "Range"
    ? `${ast.start.offset}:${ast.start.line}:${ast.start.column}-${ast.end.offset}:${ast.end.line}:${ast.end.column}`
    : { ast };
