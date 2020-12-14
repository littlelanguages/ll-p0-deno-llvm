import { Location } from "../deps/location.ts";

export type Program = {
  tag: "Program";
  declarations: Array<Declaration>;
};

export type Declaration = VariableDeclaration | FunctionDeclaration;

export type VariableDeclaration = {
  tag: "VariableDeclaration";
  access: VariableAccess;
  identifier: Identifier;
  expression: LiteralExpression;
};

export type FunctionDeclaration = {
  tag: "FunctionDeclaration";
  identifier: Identifier;
  arguments: Array<[Identifier, Type]>;
  statements: Array<Statement>;
  suffix: [Type, Expression] | undefined;
};

export enum VariableAccess {
  ReadOnly,
  ReadWrite,
}

export enum Type {
  TInt,
  TFloat,
  TBool,
}

export type Statement =
  | AssignmentStatement
  | DeclarationStatement
  | IfThenElseStatement
  | WhileStatement
  | BlockStatement
  | CallStatement
  | EmptyStatement;

export type AssignmentStatement = {
  tag: "AssignmentStatement";
  identifier: Identifier;
  expression: Expression;
};

export type DeclarationStatement = {
  tag: "DeclarationStatement";
  access: VariableAccess;
  identifier: Identifier;
  expression: Expression;
};

export type IfThenElseStatement = {
  tag: "IfThenElseStatement";
  expression: Expression;
  statement1: Statement;
  statement2: Statement | undefined;
};

export type WhileStatement = {
  tag: "WhileStatement";
  expression: Expression;
  statement: Statement;
};

export type BlockStatement = {
  tag: "BlockStatement";
  statements: Array<Statement>;
};

export type CallStatement = {
  tag: "CallStatement";
  identifier: Identifier;
  expressions: Array<Expression>;
};

export type EmptyStatement = {
  tag: "EmptyStatement";
};

export type Expression =
  | TernaryExpression
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | IdentifierReference
  | Parenthesis
  | LiteralValue;

export type TernaryExpression = {
  tag: "TernaryExpression";
  expression1: Expression;
  expression2: Expression;
  expression3: Expression;
};

export type BinaryExpression = {
  tag: "BinaryExpression";
  expression1: Expression;
  op: BinaryOp;
  expression2: Expression;
};

export type UnaryExpression = {
  tag: "UnaryExpression";
  op: UnaryOp;
  expression: Expression;
};

export type CallExpression = {
  tag: "CallExpression";
  identifier: Identifier;
  expressions: Array<Expression>;
};

export type IdentifierReference = {
  tag: "IdentifierReference";
  identifier: Identifier;
};

export type Parenthesis = {
  tag: "Parenthesis";
  location: Location;
  expression: Expression;
};

export type LiteralExpression =
  | LiteralValue
  | LiteralExpressionUnaryValue;

export type LiteralExpressionUnaryValue = {
  tag: "LiteralExpressionUnaryValue";
  op: UnaryOp;
  value: LiteralValue;
};

export type LiteralValue =
  | LiteralBool
  | LiteralInt
  | LiteralFloat
  | LiteralString;

export type LiteralBool = {
  tag: "LiteralBool";
  location: Location;
  value: boolean;
};
export type LiteralInt = {
  tag: "LiteralInt";
  location: Location;
  value: string;
};

export type LiteralFloat = {
  tag: "LiteralFloat";
  location: Location;
  value: string;
};

export type LiteralString = {
  tag: "LiteralString";
  location: Location;
  value: string;
};

export enum BinaryOp {
  Divide,
  Minus,
  Plus,
  Times,
  Equal,
  GreaterEqual,
  GreaterThan,
  LessEqual,
  LessThan,
  NotEqual,
  And,
  Or,
}

export enum UnaryOp {
  UnaryNot,
  UnaryMinus,
  UnaryPlus,
}

export type Identifier = {
  tag: "Identifier";
  location: Location;
  name: string;
};
