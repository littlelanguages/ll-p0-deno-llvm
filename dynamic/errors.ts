export type { SyntaxError } from "../static/grammar-parser.ts";
import { Location } from "../deps/location.ts";
import { SyntaxError } from "../static/grammar-parser.ts";
import { BinaryOp, Type, UnaryOp } from "./tst.ts";

export type Errors = Array<ErrorItem>;

export type ErrorItem =
  | SyntaxError
  | AttemptToRedefineDeclarationError
  | BinaryExpressionOperandsIncompatibleError
  | BinaryExpressionRequiresOperandTypeError
  | FunctionReturnTypeMismatchError
  | IfGuardNotBooleanError
  | InvalidDeclarationOfMainError
  | IncompatibleArgumentTypeError
  | LiteralFloatOverflowError
  | LiteralIntOverflowError
  | LiteralStringError
  | MismatchInNumberOfParametersError
  | TernaryExpressionResultIncompatibleError
  | TernaryExpressionNotBooleanError
  | UnableToAssignToConstantError
  | UnableToAssignIncompatibleTypesError
  | UnableToAssignToFunctionError
  | UnableToCallUnitFunctionAsValueFunctionError
  | UnableToCallConstantAsFunctionError
  | UnableToCallVariableAsFunctionError
  | UnaryExpressionRequiresOperandTypeError
  | UnableToReferenceFunctionError
  | UnableToCallValueFunctionAsUnitFunctionError
  | UnknownIdentifierError
  | WhileGuardNotBooleanError;

export type AttemptToRedefineDeclarationError = {
  tag: "AttemptToRedefineDeclarationError";
  location: Location;
  name: string;
};

export type BinaryExpressionOperandsIncompatibleError = {
  tag: "BinaryExpressionOperandsIncompatibleError";
  op: BinaryOp;
  location1: Location;
  type1: Type;
  location2: Location;
  type2: Type;
};

export type BinaryExpressionRequiresOperandTypeError = {
  tag: "BinaryExpressionRequiresOperandTypeError";
  op: BinaryOp;
  type: Type;
  location: Location;
};

export type FunctionReturnTypeMismatchError = {
  tag: "FunctionReturnTypeMismatchError";
  location: Location;
  name: string;
  type: Type;
};

export type IfGuardNotBooleanError = {
  tag: "IfGuardNotBooleanError";
  type: Type;
  location: Location;
};

export type InvalidDeclarationOfMainError = {
  tag: "InvalidDeclarationOfMainError";
  location: Location;
};

export type IncompatibleArgumentTypeError = {
  tag: "IncompatibleArgumentTypeError";
  argumentType: Type;
  parameterType: Type;
  location: Location;
};

export type LiteralFloatOverflowError = {
  tag: "LiteralFloatOverflowError";
  location: Location;
  text: string;
};

export type LiteralIntOverflowError = {
  tag: "LiteralIntOverflowError";
  location: Location;
  text: string;
};

export type LiteralStringError = {
  tag: "LiteralStringError";
  location: Location;
  text: string;
};

export type MismatchInNumberOfParametersError = {
  tag: "MismatchInNumberOfParametersError";
  arguments: number;
  parameters: number;
  location: Location;
};

export type TernaryExpressionResultIncompatibleError = {
  tag: "TernaryExpressionResultIncompatibleError";
  thenlocation: Location;
  elselocation: Location;
};

export type TernaryExpressionNotBooleanError = {
  tag: "TernaryExpressionNotBooleanError";
  boollocation: Location;
  location: Location;
};

export type UnableToAssignToConstantError = {
  tag: "UnableToAssignToConstantError";
  name: string;
  location: Location;
};

export type UnableToAssignIncompatibleTypesError = {
  tag: "UnableToAssignIncompatibleTypesError";
  type: Type;
  location: Location;
  expressionType: Type;
  expressionLocation: Location;
};

export type UnableToAssignToFunctionError = {
  tag: "UnableToAssignToFunctionError";
  name: string;
  location: Location;
};

export type UnableToCallUnitFunctionAsValueFunctionError = {
  tag: "UnableToCallUnitFunctionAsValueFunctionError";
  name: string;
  location: Location;
};

export type UnableToCallConstantAsFunctionError = {
  tag: "UnableToCallConstantAsFunctionError";
  name: string;
  location: Location;
};

export type UnableToCallVariableAsFunctionError = {
  tag: "UnableToCallVariableAsFunctionError";
  name: string;
  location: Location;
};

export type UnaryExpressionRequiresOperandTypeError = {
  tag: "UnaryExpressionRequiresOperandTypeError";
  op: UnaryOp;
  type: Type;
  location: Location;
};

export type UnableToReferenceFunctionError = {
  tag: "UnableToReferenceFunctionError";
  name: string;
  location: Location;
};

export type UnableToCallValueFunctionAsUnitFunctionError = {
  tag: "UnableToCallValueFunctionAsUnitFunctionError";
  name: string;
  location: Location;
};

export type UnknownIdentifierError = {
  tag: "UnknownIdentifierError";
  name: string;
  location: Location;
};

export type WhileGuardNotBooleanError = {
  tag: "WhileGuardNotBooleanError";
  type: Type;
  location: Location;
};
