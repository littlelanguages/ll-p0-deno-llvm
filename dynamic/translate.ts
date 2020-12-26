import { Either, left, right } from "../deps/either.ts";
import { parse } from "../static/parser.ts";
import { ErrorItem, Errors } from "./errors.ts";
import {
  BinaryOp,
  Declaration,
  Expression,
  LiteralString,
  LiteralValue,
  Parameter,
  Program,
  Statement,
  Type,
} from "./tst.ts";
import * as AST from "../static/ast.ts";
import { combine, Location } from "../deps/location.ts";
import { UnaryOp } from "../static/ast.ts";

export const translate = (input: string): Either<Errors, Program> =>
  parse(input).either((e) => left([e]), (ast) => p(ast));

type Binding = BConstant | BVariable | BFunction;

type BConstant = {
  tag: "BConstant";
  t: Type;
};

type BVariable = {
  tag: "BVariable";
  t: Type;
};

type BFunction = {
  tag: "BFunction";
  ps: Array<Type>;
  r: Type | undefined;
};

type Bindings = Map<string, Binding>;

const p = (p: AST.Program): Either<Errors, Program> => {
  const translator = {
    errors: new Array<ErrorItem>(),

    p: function (p: AST.Program): Program {
      const sigma = new Map<string, Binding>();

      p.declarations.forEach((d) => {
        if (sigma.has(d.identifier.name)) {
          this.reportError(
            {
              tag: "AttemptToRedefineDeclarationError",
              location: d.identifier.location,
              name: d.identifier.name,
            },
          );
        } else {
          sigma.set(d.identifier.name, binding(d));
        }
      });

      const main = p.declarations.find((d) => d.identifier.name === "main");

      if (main === undefined) {
        sigma.set("main", { tag: "BFunction", ps: [], r: undefined });

        return {
          tag: "Program",
          d: p.declarations.map((d) => this.d(d, sigma)),
          s: { tag: "EmptyStatement" },
        };
      } else if (main.tag === "FunctionDeclaration") {
        if (main.arguments.length !== 0 || main.suffix !== undefined) {
          this.reportError(
            {
              tag: "InvalidDeclarationOfMainError",
              location: main.identifier.location,
            },
          );
        }

        const ssp: Array<Statement> = this.ss(main.statements, sigma)[0];

        return {
          tag: "Program",
          d: p.declarations.filter((d) => d.identifier.name !== "main").map((
            d,
          ) => this.d(d, sigma)),
          s: ssp.length === 1 ? ssp[0] : { tag: "BlockStatement", ss: ssp },
        };
      } else {
        this.reportError(
          {
            tag: "InvalidDeclarationOfMainError",
            location: main.identifier.location,
          },
        );

        return {
          tag: "Program",
          d: p.declarations.map((d) => this.d(d, sigma)),
          s: { tag: "EmptyStatement" },
        };
      }
    },

    d: function (d: AST.Declaration, sigma: Bindings): Declaration {
      if (d.tag === "VariableDeclaration") {
        return d.access === AST.VariableAccess.ReadOnly
          ? {
            tag: "ConstantDeclaration",
            identifier: d.identifier.name,
            e: this.le(d.expression),
          }
          : {
            tag: "VariableDeclaration",
            identifier: d.identifier.name,
            e: this.le(d.expression),
          };
      } else {
        const validateParameters = () => {
          const names = new Set<string>();

          d.arguments.forEach((a) => {
            if (names.has(a[0].name)) {
              this.reportError(
                {
                  tag: "AttemptToRedefineDeclarationError",
                  location: a[0].location,
                  name: a[0].name,
                },
              );
            }
            names.add(a[0].name);
          });
        };

        const validateDeclarations = () => {
          const names = new Set<string>();

          d.statements.forEach((s) => {
            if (s.tag === "DeclarationStatement") {
              if (names.has(s.identifier.name)) {
                this.reportError(
                  {
                    tag: "AttemptToRedefineDeclarationError",
                    location: s.identifier.location,
                    name: s.identifier.name,
                  },
                );
              }
              names.add(s.identifier.name);
            }
          });
        };

        validateParameters();
        validateDeclarations();

        const sigmap = new Map<string, Binding>(sigma);
        d.arguments.forEach(([n, t]) => {
          sigmap.set(n.name, { tag: "BVariable", t: toType(t) });
        });

        const ssp = this.ss(d.statements, sigmap);
        const suffix = d.suffix;

        const ps: Array<Parameter> = d.arguments.map((a) => ({
          tag: "Parameter",
          n: a[0].name,
          t: toType(a[1]),
        }));

        if (suffix === undefined) {
          return {
            tag: "FunctionDeclaration",
            n: d.identifier.name,
            ps,
            ss: ssp[0],
            e: undefined,
          };
        } else {
          const ep = this.e(suffix[1], ssp[1]);
          const ept = typeOf(ep);

          if (ept !== toType(suffix[0])) {
            this.reportError(
              {
                tag: "FunctionReturnTypeMismatchError",
                location: d.identifier.location,
                name: d.identifier.name,
                type: toType(suffix[0]),
              },
            );
          }

          return {
            tag: "FunctionDeclaration",
            n: d.identifier.name,
            ps,
            ss: ssp[0],
            e: ep,
          };
        }
      }
    },

    le: function (le: AST.LiteralExpression): LiteralValue {
      if (le.tag === "LiteralExpressionUnaryValue") {
        if (le.op === AST.UnaryOp.UnaryMinus) {
          if (le.value.tag === "LiteralInt") {
            const s = `-${le.value.value}`;
            const v = parseInt(s);

            if (v < -2147483648) {
              this.reportError(
                {
                  tag: "LiteralIntOverflowError",
                  location: combine(le.location, le.value.location),
                  text: s,
                },
              );
            }
            return { tag: "LiteralInt", v: v | 0 };
          } else if (le.value.tag === "LiteralFloat") {
            const s = `-${le.value.value}`;
            const v = parseFloat(s);
            if (!isFinite(Math.fround(v))) {
              this.reportError(
                {
                  tag: "LiteralFloatOverflowError",
                  location: combine(le.location, le.value.location),
                  text: s,
                },
              );
            }
            return { tag: "LiteralFloat", v };
          } else {
            throw new Error("TODO: le: `${JSON.stringify(le, null, 2)}`");
          }
        } else {
          return this.lv(le.value);
        }
      } else {
        return this.lv(le);
      }
    },

    lv: function (lv: AST.LiteralValue): LiteralValue {
      if (lv.tag === "LiteralBool") {
        return { tag: "LiteralBool", v: lv.value };
      } else if (lv.tag === "LiteralInt") {
        const v = parseInt(lv.value);

        if (v > 2147483647) {
          this.reportError(
            {
              tag: "LiteralIntOverflowError",
              location: lv.location,
              text: lv.value,
            },
          );
        }
        return { tag: "LiteralInt", v: v | 0 };
      }
      if (lv.tag === "LiteralString") {
        this.reportError(
          { tag: "LiteralStringError", location: lv.location, text: lv.value },
        );
        return { tag: "LiteralBool", v: true };
      } else {
        const v = parseFloat(lv.value);

        if (!isFinite(Math.fround(v))) {
          this.reportError(
            {
              tag: "LiteralFloatOverflowError",
              location: lv.location,
              text: lv.value,
            },
          );
        }
        return { tag: "LiteralFloat", v };
      }
    },

    ss: function (
      ss: Array<AST.Statement>,
      sigma: Bindings,
    ): [Array<Statement>, Bindings] {
      let sigmap = sigma;
      const ssp: Array<Statement> = [];

      ss.forEach((s) => {
        const r = this.s(s, sigmap);
        ssp.push(r[0]);
        sigmap = r[1];
      });

      return [ssp, sigmap];
    },

    s: function (s: AST.Statement, sigma: Bindings): [Statement, Bindings] {
      if (s.tag === "AssignmentStatement") {
        const binding = sigma.get(s.identifier.name);
        const ep = this.e(s.expression, sigma);

        if (binding === undefined) {
          this.reportError(
            {
              tag: "UnknownIdentifierError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
        } else if (binding.tag === "BConstant") {
          this.reportError(
            {
              tag: "UnableToAssignToConstantError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
        } else if (binding.tag === "BVariable") {
          if (binding.t !== typeOf(ep)) {
            this.reportError(
              {
                tag: "UnableToAssignIncompatibleTypesError",
                type: binding.t,
                location: s.identifier.location,
                expressionType: typeOf(ep),
                expressionLocation: locationOf(s.expression),
              },
            );
          }
        } else {
          this.reportError(
            {
              tag: "UnableToAssignToFunctionError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
        }
        return [
          { tag: "AssignmentStatement", n: s.identifier.name, e: ep },
          sigma,
        ];
      } else if (s.tag === "DeclarationStatement") {
        const ep = this.e(s.expression, sigma);
        if (s.access === AST.VariableAccess.ReadOnly) {
          return [
            {
              tag: "ConstantDeclarationStatement",
              n: s.identifier.name,
              e: ep,
            },
            new Map(sigma).set(
              s.identifier.name,
              { tag: "BConstant", t: typeOf(ep) },
            ),
          ];
        } else {
          return [
            {
              tag: "VariableDeclarationStatement",
              n: s.identifier.name,
              e: ep,
            },
            new Map(sigma).set(
              s.identifier.name,
              { tag: "BVariable", t: typeOf(ep) },
            ),
          ];
        }
      } else if (s.tag === "IfThenElseStatement") {
        const ep = this.e(s.expression, sigma);
        const ept = typeOf(ep);

        if (ept !== Type.TError && ept !== Type.Bool) {
          this.reportError(
            {
              tag: "IfGuardNotBooleanError",
              type: ept,
              location: locationOf(s.expression),
            },
          );
        }

        return [
          {
            tag: "IfThenElseStatement",
            e: ep,
            s1: this.s(s.statement1, sigma)[0],
            s2: s.statement2 === undefined
              ? undefined
              : this.s(s.statement2, sigma)[0],
          },
          sigma,
        ];
      } else if (s.tag === "WhileStatement") {
        const ep = this.e(s.expression, sigma);
        const ept = typeOf(ep);

        if (ept !== Type.TError && ept !== Type.Bool) {
          this.reportError(
            {
              tag: "WhileGuardNotBooleanError",
              type: ept,
              location: locationOf(s.expression),
            },
          );
        }

        return [
          {
            tag: "WhileStatement",
            e: ep,
            s: this.s(s.statement, sigma)[0],
          },
          sigma,
        ];
      } else if (s.tag === "CallStatement") {
        const binding = sigma.get(s.identifier.name);

        if (binding === undefined) {
          if (
            s.identifier.name === "print" || s.identifier.name === "println"
          ) {
            return [
              {
                tag: "CallStatement",
                n: s.identifier.name,
                args: s.expressions.map((e) => this.calle(e, sigma)),
              },
              sigma,
            ];
          } else {
            this.reportError(
              {
                tag: "UnknownIdentifierError",
                name: s.identifier.name,
                location: s.identifier.location,
              },
            );
            return [
              { tag: "CallStatement", n: s.identifier.name, args: [] },
              sigma,
            ];
          }
        } else if (binding.tag === "BConstant") {
          this.reportError(
            {
              tag: "UnableToCallConstantAsFunctionError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
          return [
            { tag: "CallStatement", n: s.identifier.name, args: [] },
            sigma,
          ];
        } else if (binding.tag === "BVariable") {
          this.reportError(
            {
              tag: "UnableToCallVariableAsFunctionError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
          return [
            { tag: "CallStatement", n: s.identifier.name, args: [] },
            sigma,
          ];
        } else if (binding.tag === "BFunction") {
          const argsp = s.expressions.map((e) => this.calle(e, sigma));
          if (argsp.length !== binding.ps.length) {
            this.reportError(
              {
                tag: "MismatchInNumberOfParametersError",
                arguments: argsp.length,
                parameters: binding.ps.length,
                location: s.identifier.location,
              },
            );
          } else {
            binding.ps.forEach((parameter, index) => {
              if (parameter !== typeOf(argsp[index])) {
                this.reportError(
                  {
                    tag: "IncompatibleArgumentTypeError",
                    argumentType: typeOf(argsp[index]),
                    parameterType: parameter,
                    location: locationOf(s.expressions[index]),
                  },
                );
              }
            });
          }

          if (binding.r === undefined) {
            return [
              { tag: "CallStatement", n: s.identifier.name, args: argsp },
              sigma,
            ];
          } else {
            this.reportError(
              {
                tag: "UnableToCallValueFunctionAsUnitFunctionError",
                name: s.identifier.name,
                location: s.identifier.location,
              },
            );
            return [
              { tag: "CallStatement", n: s.identifier.name, args: argsp },
              sigma,
            ];
          }
        } else {
          this.reportError(
            {
              tag: "UnknownIdentifierError",
              name: s.identifier.name,
              location: s.identifier.location,
            },
          );
          return [
            { tag: "CallStatement", n: s.identifier.name, args: [] },
            sigma,
          ];
        }
      } else if (s.tag === "BlockStatement") {
        return [
          { tag: "BlockStatement", ss: this.ss(s.statements, sigma)[0] },
          sigma,
        ];
      } else {
        return [{ tag: "EmptyStatement" }, sigma];
      }
    },

    calle: function (
      e: AST.Expression | AST.LiteralString,
      sigma: Bindings,
    ): Expression | LiteralString {
      if (e.tag === "LiteralString") {
        return {
          tag: "LiteralString",
          v: e.value.substr(1, e.value.length - 2),
        };
      } else {
        return this.e(e, sigma);
      }
    },

    e: function (e: AST.Expression, sigma: Bindings): Expression {
      if (e.tag === "TernaryExpression") {
        const e1p = this.e(e.expression1, sigma);
        const e2p = this.e(e.expression2, sigma);
        const e3p = this.e(e.expression3, sigma);

        const e1pt = typeOf(e1p);
        const e2pt = typeOf(e2p);
        const e3pt = typeOf(e3p);

        if (e1pt !== Type.Bool && e1pt !== Type.TError) {
          this.reportError(
            {
              tag: "TernaryExpressionNotBooleanError",
              boollocation: locationOf(e.expression1),
              location: locationOf(e),
            },
          );
        }

        if (e2pt !== Type.TError && e3pt !== Type.TError && e2pt !== e3pt) {
          this.reportError(
            {
              tag: "TernaryExpressionResultIncompatibleError",
              thenlocation: locationOf(e.expression2),
              elselocation: locationOf(e.expression3),
            },
          );
        }

        return { tag: "TernaryExpression", e1: e1p, e2: e2p, e3: e3p };
      } else if (e.tag === "BinaryExpression") {
        const opp = this.bo(e.op);
        const e1p = this.e(e.expression1, sigma);
        const e2p = this.e(e.expression2, sigma);

        const e1pt = typeOf(e1p);
        const e2pt = typeOf(e2p);

        if (opp === BinaryOp.And || opp === BinaryOp.Or) {
          if (e1pt !== Type.Bool && e1pt !== Type.TError) {
            this.reportError(
              {
                tag: "BinaryExpressionRequiresOperandTypeError",
                op: opp,
                type: e1pt,
                location: locationOf(e.expression1),
              },
            );
          }
          if (e2pt !== Type.Bool && e2pt !== Type.TError) {
            this.reportError(
              {
                tag: "BinaryExpressionRequiresOperandTypeError",
                op: opp,
                type: e2pt,
                location: locationOf(e.expression2),
              },
            );
          }
        } else if (opp == BinaryOp.Equal || opp === BinaryOp.NotEqual) {
          if (e1pt !== Type.TError && e2pt !== Type.TError && e1pt !== e2pt) {
            this.reportError(
              {
                tag: "BinaryExpressionOperandsIncompatibleError",
                op: opp,
                location1: locationOf(e.expression1),
                type1: e1pt,
                location2: locationOf(e.expression2),
                type2: e2pt,
              },
            );
          }
        } else {
          if (
            e1pt !== Type.TError && e1pt !== Type.Float && e1pt !== Type.Int
          ) {
            this.reportError(
              {
                tag: "BinaryExpressionRequiresOperandTypeError",
                op: opp,
                type: e1pt,
                location: locationOf(e.expression1),
              },
            );
          }
          if (
            e2pt !== Type.TError && e2pt !== Type.Float && e2pt !== Type.Int
          ) {
            this.reportError(
              {
                tag: "BinaryExpressionRequiresOperandTypeError",
                op: opp,
                type: e2pt,
                location: locationOf(e.expression2),
              },
            );
          }
          if (e1pt !== Type.TError && e2pt !== Type.TError && e1pt !== e2pt) {
            this.reportError(
              {
                tag: "BinaryExpressionOperandsIncompatibleError",
                op: opp,
                location1: locationOf(e.expression1),
                type1: e1pt,
                location2: locationOf(e.expression2),
                type2: e2pt,
              },
            );
          }
        }

        return { tag: "BinaryExpression", op: opp, e1: e1p, e2: e2p };
      } else if (e.tag === "UnaryExpression") {
        if (e.op === UnaryOp.UnaryMinus && e.expression.tag === "LiteralInt") {
          return this.le(
            {
              tag: "LiteralExpressionUnaryValue",
              location: e.location,
              op: AST.UnaryOp.UnaryMinus,
              value: e.expression,
            },
          );
        } else {
          const opp = this.uo(e.op);
          const ep = this.e(e.expression, sigma);
          const ept = typeOf(ep);

          if (opp === UnaryOp.UnaryNot) {
            if (ept !== Type.Bool && ept !== Type.TError) {
              this.reportError(
                {
                  tag: "UnaryExpressionRequiresOperandTypeError",
                  op: opp,
                  type: ept,
                  location: locationOf(e.expression),
                },
              );
            }
          } else {
            if (ept !== Type.Int && ept !== Type.Float && ept !== Type.TError) {
              this.reportError(
                {
                  tag: "UnaryExpressionRequiresOperandTypeError",
                  op: opp,
                  type: ept,
                  location: locationOf(e.expression),
                },
              );
            }
          }
          return { tag: "UnaryExpression", op: opp, e: ep };
        }
      } else if (e.tag === "CallExpression") {
        const binding = sigma.get(e.identifier.name);

        if (binding === undefined) {
          this.reportError(
            {
              tag: "UnknownIdentifierError",
              name: e.identifier.name,
              location: e.identifier.location,
            },
          );
          return {
            tag: "IdentifierReference",
            n: e.identifier.name,
            t: Type.TError,
          };
        } else if (binding.tag === "BConstant") {
          this.reportError(
            {
              tag: "UnableToCallConstantAsFunctionError",
              name: e.identifier.name,
              location: e.identifier.location,
            },
          );
          return {
            tag: "IdentifierReference",
            n: e.identifier.name,
            t: Type.TError,
          };
        } else if (binding.tag === "BVariable") {
          this.reportError(
            {
              tag: "UnableToCallVariableAsFunctionError",
              name: e.identifier.name,
              location: e.identifier.location,
            },
          );
          return {
            tag: "IdentifierReference",
            n: e.identifier.name,
            t: Type.TError,
          };
        } else {
          const argsp = e.expressions.map((e) => this.e(e, sigma));
          if (argsp.length !== binding.ps.length) {
            this.reportError(
              {
                tag: "MismatchInNumberOfParametersError",
                arguments: argsp.length,
                parameters: binding.ps.length,
                location: e.identifier.location,
              },
            );
          } else {
            binding.ps.forEach((parameter, index) => {
              if (parameter !== typeOf(argsp[index])) {
                this.reportError(
                  {
                    tag: "IncompatibleArgumentTypeError",
                    argumentType: typeOf(argsp[index]),
                    parameterType: parameter,
                    location: locationOf(e.expressions[index]),
                  },
                );
              }
            });
          }

          if (binding.r === undefined) {
            this.reportError(
              {
                tag: "UnableToCallUnitFunctionAsValueFunctionError",
                name: e.identifier.name,
                location: e.identifier.location,
              },
            );

            return {
              tag: "IdentifierReference",
              n: e.identifier.name,
              t: Type.TError,
            };
          } else {
            return {
              tag: "CallExpression",
              t: binding.r,
              n: e.identifier.name,
              args: argsp,
            };
          }
        }
      } else if (e.tag === "IdentifierReference") {
        const binding = sigma.get(e.identifier.name);
        if (binding === undefined) {
          this.reportError(
            {
              tag: "UnknownIdentifierError",
              name: e.identifier.name,
              location: e.identifier.location,
            },
          );
          return {
            tag: "IdentifierReference",
            t: Type.TError,
            n: e.identifier.name,
          };
        } else {
          if (binding.tag === "BConstant" || binding.tag === "BVariable") {
            return {
              tag: "IdentifierReference",
              t: binding.t,
              n: e.identifier.name,
            };
          } else {
            this.reportError(
              {
                tag: "UnableToReferenceFunctionError",
                name: e.identifier.name,
                location: e.identifier.location,
              },
            );
            return {
              tag: "IdentifierReference",
              t: Type.TError,
              n: e.identifier.name,
            };
          }
        }
      } else if (e.tag === "Parenthesis") {
        return this.e(e.expression, sigma);
      } else {
        return this.lv(e);
      }
    },

    bo: (op: AST.BinaryOp): BinaryOp => {
      const x: any = op;

      return x;
    },

    uo: (op: AST.UnaryOp): UnaryOp => {
      const x: any = op;

      return x;
    },

    reportError: function (e: ErrorItem) {
      this.errors.push(e);
    },
  };

  const result = translator.p(p);

  return (translator.errors.length === 0)
    ? right(result)
    : left(translator.errors);
};

const binding = (d: AST.Declaration): Binding =>
  d.tag === "VariableDeclaration"
    ? (d.access === AST.VariableAccess.ReadOnly
      ? { tag: "BConstant", t: typeOfLiteralExpression(d.expression) }
      : { tag: "BVariable", t: typeOfLiteralExpression(d.expression) })
    : d.suffix === undefined
    ? {
      tag: "BFunction",
      ps: d.arguments.map((a) => toType(a[1])),
      r: undefined,
    }
    : {
      tag: "BFunction",
      ps: d.arguments.map((a) => toType(a[1])),
      r: toType(d.suffix[0]),
    };

export const toType = (t: AST.Type): Type => {
  const x: any = t;

  return x;
};

export const typeOfLiteralExpression = (le: AST.LiteralExpression): Type =>
  le.tag === "LiteralExpressionUnaryValue"
    ? typeOfLiteralExpression(le.value)
    : le.tag === "LiteralBool"
    ? Type.Bool
    : le.tag === "LiteralFloat"
    ? Type.Float
    : le.tag === "LiteralInt"
    ? Type.Int
    : Type.String;

export const typeOf = (
  a: LiteralValue | LiteralString | Expression,
): Type => {
  if (a.tag === "LiteralBool") {
    return Type.Bool;
  } else if (a.tag === "LiteralInt") {
    return Type.Int;
  } else if (a.tag === "LiteralFloat") {
    return Type.Float;
  } else if (a.tag === "LiteralString") {
    return Type.String;
  } else if (a.tag === "IdentifierReference") {
    return a.t;
  } else if (a.tag === "CallExpression") {
    return a.t;
  } else if (a.tag === "UnaryExpression") {
    return typeOf(a.e);
  } else if (a.tag === "BinaryExpression") {
    return (a.op === BinaryOp.Plus || a.op === BinaryOp.Minus ||
        a.op === BinaryOp.Times || a.op === BinaryOp.Divide)
      ? typeOf(a.e1)
      : Type.Bool;
  } /*if (a.tag === "TernaryExpression")*/ else {
    return typeOf(a.e2);
  }
};

const locationOf = (
  e: AST.Expression,
): Location => {
  if (e.tag === "LiteralBool") {
    return e.location;
  } else if (e.tag === "LiteralInt") {
    return e.location;
  } else if (e.tag === "LiteralFloat") {
    return e.location;
  } else if (e.tag === "LiteralString") {
    return e.location;
  } else if (e.tag === "IdentifierReference") {
    return e.identifier.location;
  } else if (e.tag === "UnaryExpression") {
    return combine(e.location, locationOf(e.expression));
  } else if (e.tag === "BinaryExpression") {
    return combine(locationOf(e.expression1), locationOf(e.expression2));
  } else if (e.tag === "TernaryExpression") {
    return combine(locationOf(e.expression1), locationOf(e.expression3));
  } else if (e.tag === "CallExpression") {
    return e.identifier.location;
  } else {
    return e.location;
  }
};
