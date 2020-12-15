import { Either } from "../deps/either.ts";
import { combine, Location } from "../deps/location.ts";
import {
  BinaryOp,
  Expression,
  FunctionDeclaration,
  Identifier,
  LiteralExpression,
  LiteralValue,
  Program,
  Statement,
  Type,
  UnaryOp,
  VariableAccess,
  VariableDeclaration,
} from "./ast.ts";
import { parseProgram, SyntaxError, Visitor } from "./grammar-parser.ts";
import { Token, TToken } from "./grammar-scanner.ts";

export const parse = (input: string): Either<SyntaxError, Program> =>
  parseProgram(input, visitor);

type T_Program = Program;
type T_VariableDeclaration = VariableDeclaration;
type T_LiteralExpression = LiteralExpression;
type T_FunctionDeclaration = FunctionDeclaration;
type T_FunctionDeclarationSuffix = [
  Array<Statement>,
  [Type, Expression] | undefined,
];
type T_Type = Type;
type T_TypedIdentifier = [Identifier, Type];
type T_Statement = Statement;
type T_Expression = Expression;
type T_OrExpression = Expression;
type T_AndExpression = Expression;
type T_RelationalExpression = Expression;
type T_RelationalOp = BinaryOp;
type T_AdditiveExpression = Expression;
type T_AdditiveOp = BinaryOp;
type T_MultiplicativeExpression = Expression;
type T_MultiplicativeOp = BinaryOp;
type T_Factor = Expression;
type T_UnaryOp = [Location, UnaryOp];

const visitor: Visitor<
  T_Program,
  T_VariableDeclaration,
  T_LiteralExpression,
  T_FunctionDeclaration,
  T_FunctionDeclarationSuffix,
  T_Type,
  T_TypedIdentifier,
  T_Statement,
  T_Expression,
  T_OrExpression,
  T_AndExpression,
  T_RelationalExpression,
  T_RelationalOp,
  T_AdditiveExpression,
  T_AdditiveOp,
  T_MultiplicativeExpression,
  T_MultiplicativeOp,
  T_Factor,
  T_UnaryOp
> = {
  visitProgram: (
    a: Array<(T_VariableDeclaration | T_FunctionDeclaration)>,
  ): T_Program => ({ tag: "Program", declarations: a }),

  visitVariableDeclaration: (
    a1: (Token | Token),
    a2: Token,
    a3: Token,
    a4: T_LiteralExpression,
    a5: Token,
  ): T_VariableDeclaration => ({
    tag: "VariableDeclaration",
    access: a1[0] === TToken.Const
      ? VariableAccess.ReadOnly
      : VariableAccess.ReadWrite,
    identifier: mkIdentifier(a2),
    expression: a4,
  }),

  visitLiteralExpression1: (a: Token): T_LiteralExpression => ({
    tag: "LiteralBool",
    location: a[1],
    value: true,
  }),

  visitLiteralExpression2: (a: Token): T_LiteralExpression => ({
    tag: "LiteralBool",
    location: a[1],
    value: false,
  }),

  visitLiteralExpression3: (
    a1: (Token | Token) | undefined,
    a2: (Token | Token),
  ): T_LiteralExpression => {
    const v: LiteralValue = a2[0] == TToken.LiteralInt
      ? { tag: "LiteralInt", location: a2[1], value: a2[2] }
      : { tag: "LiteralFloat", location: a2[1], value: a2[2] };

    return a1 === undefined ? v : {
      tag: "LiteralExpressionUnaryValue",
      location: a1[1],
      op: a1[0] === TToken.Plus ? UnaryOp.UnaryPlus : UnaryOp.UnaryMinus,
      value: v,
    };
  },

  visitFunctionDeclaration: (
    a1: Token,
    a2: Token,
    a3: Token,
    a4: [T_TypedIdentifier, Array<[Token, T_TypedIdentifier]>] | undefined,
    a5: Token,
    a6: T_FunctionDeclarationSuffix,
  ): T_FunctionDeclaration => {
    const mf = (
      a: [Token, T_TypedIdentifier],
    ): [Identifier, Type] => [a[1][0], a[1][1]];

    const args: Array<[Identifier, Type]> = a4 === undefined
      ? []
      : [[a4[0][0], a4[0][1]], ...(a4[1].map(mf))];

    return ({
      tag: "FunctionDeclaration",
      identifier: mkIdentifier(a2),
      arguments: args,
      statements: a6[0],
      suffix: a6[1],
    });
  },

  visitFunctionDeclarationSuffix1: (
    a1: Token,
    a2: T_Type,
    a3: Token,
    a4: Array<T_Statement>,
    a5: Token,
    a6: T_Expression,
    a7: Token,
    a8: Token,
  ): T_FunctionDeclarationSuffix => [a4, [a2, a6]],

  visitFunctionDeclarationSuffix2: (
    a1: Token,
    a2: Array<T_Statement>,
    a3: Token,
  ): T_FunctionDeclarationSuffix => [a2, undefined],

  visitType1: (a: Token): T_Type => Type.Int,
  visitType2: (a: Token): T_Type => Type.Float,
  visitType3: (a: Token): T_Type => Type.Bool,

  visitTypedIdentifier: (
    a1: Token,
    a2: Token,
    a3: T_Type,
  ): T_TypedIdentifier => [mkIdentifier(a1), a3],

  visitStatement1: (
    a1: (Token | Token),
    a2: Token,
    a3: Token,
    a4: T_Expression,
    a5: Token,
  ): T_Statement => ({
    tag: "DeclarationStatement",
    access: a1[0] === TToken.Const ? VariableAccess.ReadOnly
    : VariableAccess.ReadWrite,
    identifier: mkIdentifier(a2),
    expression: a4,
  }),
  visitStatement2: (
    a1: Token,
    a2: T_Expression,
    a3: T_Statement,
    a4: [Token, T_Statement] | undefined,
  ): T_Statement => ({
    tag: "IfThenElseStatement",
    expression: a2,
    statement1: a3,
    statement2: a4 === undefined ? undefined : a4[1],
  }),
  visitStatement3: (
    a1: Token,
    a2: T_Expression,
    a3: T_Statement,
  ): T_Statement => ({
    tag: "WhileStatement",
    expression: a2,
    statement: a3,
  }),
  visitStatement4: (
    a1: Token,
    a2: Array<T_Statement>,
    a3: Token,
  ): T_Statement => ({
    tag: "BlockStatement",
    statements: a2,
  }),
  visitStatement5: (
    a1: Token,
    a2: (
      | [
        Token,
        [T_Expression, Array<[Token, T_Expression]>] | undefined,
        Token,
      ]
      | [Token, T_Expression]
    ),
    a3: Token,
  ): T_Statement =>
    (a2.length === 3)
      ? {
        tag: "CallStatement",
        identifier: mkIdentifier(a1),
        expressions: a2[1] === undefined ? []
        : [a2[1][0], ...a2[1][1].map((e) => e[1])],
      }
      : {
        tag: "AssignmentStatement",
        identifier: mkIdentifier(a1),
        expression: a2[1],
      },
  visitStatement6: (a: Token): T_Statement => ({ tag: "EmptyStatement" }),

  visitExpression: (
    a1: T_OrExpression,
    a2: [Token, T_Expression, Token, T_Expression] | undefined,
  ): T_Expression =>
    a2 === undefined ? a1 : {
      tag: "TernaryExpression",
      expression1: a1,
      expression2: a2[1],
      expression3: a2[3],
    },
  visitOrExpression: (
    a1: T_AndExpression,
    a2: Array<[Token, T_AndExpression]>,
  ): T_OrExpression =>
    a2.reduce(
      (a, b) => ({
        tag: "BinaryExpression",
        expression1: a,
        op: BinaryOp.Or,
        expression2: b[1],
      }),
      a1,
    ),
  visitAndExpression: (
    a1: T_RelationalExpression,
    a2: Array<[Token, T_RelationalExpression]>,
  ): T_AndExpression =>
    a2.reduce(
      (a, b) => ({
        tag: "BinaryExpression",
        expression1: a,
        op: BinaryOp.And,
        expression2: b[1],
      }),
      a1,
    ),
  visitRelationalExpression: (
    a1: T_AdditiveExpression,
    a2: [T_RelationalOp, T_AdditiveExpression] | undefined,
  ): T_RelationalExpression =>
    a2 === undefined ? a1 : {
      tag: "BinaryExpression",
      expression1: a1,
      op: a2[0],
      expression2: a2[1],
    },
  visitRelationalOp1: (a: Token): T_RelationalOp => BinaryOp.Equal,
  visitRelationalOp2: (a: Token): T_RelationalOp => BinaryOp.NotEqual,
  visitRelationalOp3: (a: Token): T_RelationalOp => BinaryOp.LessEqual,
  visitRelationalOp4: (a: Token): T_RelationalOp => BinaryOp.LessThan,
  visitRelationalOp5: (a: Token): T_RelationalOp => BinaryOp.GreaterEqual,
  visitRelationalOp6: (a: Token): T_RelationalOp => BinaryOp.GreaterThan,
  visitAdditiveExpression: (
    a1: T_MultiplicativeExpression,
    a2: Array<[T_AdditiveOp, T_MultiplicativeExpression]>,
  ): T_AdditiveExpression =>
    a2.reduce(
      (a, b) => ({
        tag: "BinaryExpression",
        expression1: a,
        op: b[0],
        expression2: b[1],
      }),
      a1,
    ),
  visitAdditiveOp1: (a: Token): T_AdditiveOp => BinaryOp.Plus,
  visitAdditiveOp2: (a: Token): T_AdditiveOp => BinaryOp.Minus,
  visitMultiplicativeExpression: (
    a1: T_Factor,
    a2: Array<[T_MultiplicativeOp, T_Factor]>,
  ): T_MultiplicativeExpression =>
    a2.reduce(
      (a, b) => ({
        tag: "BinaryExpression",
        expression1: a,
        op: b[0],
        expression2: b[1],
      }),
      a1,
    ),
  visitMultiplicativeOp1: (a: Token): T_MultiplicativeOp => BinaryOp.Times,
  visitMultiplicativeOp2: (a: Token): T_MultiplicativeOp => BinaryOp.Divide,
  visitFactor1: (a: Token): T_Factor => ({
    tag: "LiteralInt",
    location: a[1],
    value: a[2],
  }),
  visitFactor2: (a: Token): T_Factor => ({
    tag: "LiteralFloat",
    location: a[1],
    value: a[2],
  }),
  visitFactor3: (a: Token): T_Factor => ({
    tag: "LiteralString",
    location: a[1],
    value: a[2],
  }),
  visitFactor4: (a: Token): T_Factor => ({
    tag: "LiteralBool",
    location: a[1],
    value: true,
  }),
  visitFactor5: (a: Token): T_Factor => ({
    tag: "LiteralBool",
    location: a[1],
    value: false,
  }),
  visitFactor6: (a1: T_UnaryOp, a2: T_Factor): T_Factor => ({
    tag: "UnaryExpression",
    location: a1[0],
    op: a1[1],
    expression: a2,
  }),
  visitFactor7: (a1: Token, a2: T_Expression, a3: Token): T_Factor => ({
    tag: "Parenthesis",
    location: combine(a1[1], a3[1]),
    expression: a2,
  }),
  visitFactor8: (
    a1: Token,
    a2:
      | [Token, [T_Expression, Array<[Token, T_Expression]>] | undefined, Token]
      | undefined,
  ): T_Factor =>
    a2 === undefined
      ? { tag: "IdentifierReference", identifier: mkIdentifier(a1) }
      : {
        tag: "CallExpression",
        identifier: mkIdentifier(a1),
        expressions: a2[1] === undefined
          ? []
          : [a2[1][0], ...a2[1][1].map((a) => a[1])],
      },
  visitUnaryOp1: (a: Token): T_UnaryOp => [a[1], UnaryOp.UnaryNot],
  visitUnaryOp2: (a: Token): T_UnaryOp => [a[1], UnaryOp.UnaryMinus],
  visitUnaryOp3: (a: Token): T_UnaryOp => [a[1], UnaryOp.UnaryPlus],
};

const mkIdentifier = (token: Token): Identifier => ({
  tag: "Identifier",
  location: token[1],
  name: token[2],
});
