export type Program = {
  tag: "Program";
  declarations: Array<Declaration>;
  statement: Statement;
};

export type Declaration =
  | ConstantDeclaration
  | VariableDeclaration
  | FunctionDeclaration;

export type ConstantDeclaration = {
  tag: "ConstantDeclaration";
  n: string;
  v: LiteralValue;
};

export type VariableDeclaration = {
  tag: "VariableDeclaration";
  n: string;
  v: LiteralValue;
};

export type FunctionDeclaration = {
  tag: "VariableDeclaration";
  n: string;
  ps: Array<[string, Type]>;
  ss: Array<Statement>;
  e: Expression | undefined;
};

export enum Type {
  Int,
  Float,
  Bool,
  String,
  TError,
}

export type Statement =
  | AssignmentStatement
  | ConstantDeclarationStatement
  | VariableDeclarationStatement
  | IfThenElseStatement
  | WhileStatement
  | BlockStatement
  | CallStatement
  | EmptyStatement;

export type AssignmentStatement = {
  tag: "AssignmentStatement";
  n: string;
  v: Expression;
};

export type ConstantDeclarationStatement = {
  tag: "ConstantDeclarationStatement";
  n: string;
  v: Expression;
};

export type VariableDeclarationStatement = {
  tag: "VariableDeclarationStatement";
  n: string;
  v: Expression;
};

export type IfThenElseStatement = {
  tag: "IfThenElseStatement";
  e: Expression;
  s1: Statement;
  s2: Statement | undefined;
};

export type WhileStatement = {
  tag: "WhileStatement";
  e: Expression;
  s: Statement;
};

export type BlockStatement = {
  tag: "BlockStatement";
  ss: Array<Statement>;
};

export type CallStatement = {
  tag: "CallStatement";
  n: string;
  args: Array<Expression>;
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
  | LiteralValue;

export type TernaryExpression = {
  tag: "TernaryExpression";
  e1: Expression;
  e2: Expression;
  e3: Expression;
};

export type BinaryExpression = {
  tag: "BinaryExpression";
  op: BinaryOp;
  e1: Expression;
  e2: Expression;
};

export type UnaryExpression = {
  tag: "UnaryExpression";
  op: UnaryOp;
  e: Expression;
};

export type CallExpression = {
  tag: "CallExpression";
  t: Type;
  n: string;
  args: Array<Expression>;
};

export type IdentifierReference = {
  tag: "IdentifierReference";
  t: Type;
  n: string;
};

export type LiteralValue =
  | LiteralBool
  | LiteralInt
  | LiteralFloat
  | LiteralString;

export type LiteralBool = {
  tag: "LiteralBool";
  v: boolean;
};

export type LiteralInt = {
  tag: "LiteralInt";
  v: number;
};

export type LiteralFloat = {
  tag: "LiteralFloat";
  v: number;
};

export type LiteralString = {
  tag: "LiteralString";
  v: string;
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
