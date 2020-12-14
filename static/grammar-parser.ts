import {
  Either,
  left,
  right,
} from "https://raw.githubusercontent.com/littlelanguages/deno-lib-data-either/0.1.2/mod.ts";
import { mkScanner, Scanner, Token, TToken } from "./grammar-scanner.ts";

export interface Visitor<
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
  T_UnaryOp,
> {
  visitProgram(
    a: Array<(T_VariableDeclaration | T_FunctionDeclaration)>,
  ): T_Program;
  visitVariableDeclaration(
    a1: (Token | Token),
    a2: Token,
    a3: Token,
    a4: T_LiteralExpression,
    a5: Token,
  ): T_VariableDeclaration;
  visitLiteralExpression1(a: Token): T_LiteralExpression;
  visitLiteralExpression2(a: Token): T_LiteralExpression;
  visitLiteralExpression3(
    a1: (Token | Token) | undefined,
    a2: (Token | Token),
  ): T_LiteralExpression;
  visitFunctionDeclaration(
    a1: Token,
    a2: Token,
    a3: Token,
    a4: [T_TypedIdentifier, Array<[Token, T_TypedIdentifier]>] | undefined,
    a5: Token,
    a6: T_FunctionDeclarationSuffix,
  ): T_FunctionDeclaration;
  visitFunctionDeclarationSuffix1(
    a1: Token,
    a2: T_Type,
    a3: Token,
    a4: Array<T_Statement>,
    a5: Token,
    a6: T_Expression,
    a7: Token,
    a8: Token,
  ): T_FunctionDeclarationSuffix;
  visitFunctionDeclarationSuffix2(
    a1: Token,
    a2: Array<T_Statement>,
    a3: Token,
  ): T_FunctionDeclarationSuffix;
  visitType1(a: Token): T_Type;
  visitType2(a: Token): T_Type;
  visitType3(a: Token): T_Type;
  visitTypedIdentifier(a1: Token, a2: Token, a3: T_Type): T_TypedIdentifier;
  visitStatement1(
    a1: (Token | Token),
    a2: Token,
    a3: Token,
    a4: T_Expression,
    a5: Token,
  ): T_Statement;
  visitStatement2(
    a1: Token,
    a2: T_Expression,
    a3: T_Statement,
    a4: [Token, T_Statement] | undefined,
  ): T_Statement;
  visitStatement3(a1: Token, a2: T_Expression, a3: T_Statement): T_Statement;
  visitStatement4(a1: Token, a2: Array<T_Statement>, a3: Token): T_Statement;
  visitStatement5(
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
  ): T_Statement;
  visitStatement6(a: Token): T_Statement;
  visitExpression(
    a1: T_OrExpression,
    a2: [Token, T_Expression, Token, T_Expression] | undefined,
  ): T_Expression;
  visitOrExpression(
    a1: T_AndExpression,
    a2: Array<[Token, T_AndExpression]>,
  ): T_OrExpression;
  visitAndExpression(
    a1: T_RelationalExpression,
    a2: Array<[Token, T_RelationalExpression]>,
  ): T_AndExpression;
  visitRelationalExpression(
    a1: T_AdditiveExpression,
    a2: [T_RelationalOp, T_AdditiveExpression] | undefined,
  ): T_RelationalExpression;
  visitRelationalOp1(a: Token): T_RelationalOp;
  visitRelationalOp2(a: Token): T_RelationalOp;
  visitRelationalOp3(a: Token): T_RelationalOp;
  visitRelationalOp4(a: Token): T_RelationalOp;
  visitRelationalOp5(a: Token): T_RelationalOp;
  visitRelationalOp6(a: Token): T_RelationalOp;
  visitAdditiveExpression(
    a1: T_MultiplicativeExpression,
    a2: Array<[T_AdditiveOp, T_MultiplicativeExpression]>,
  ): T_AdditiveExpression;
  visitAdditiveOp1(a: Token): T_AdditiveOp;
  visitAdditiveOp2(a: Token): T_AdditiveOp;
  visitMultiplicativeExpression(
    a1: T_Factor,
    a2: Array<[T_MultiplicativeOp, T_Factor]>,
  ): T_MultiplicativeExpression;
  visitMultiplicativeOp1(a: Token): T_MultiplicativeOp;
  visitMultiplicativeOp2(a: Token): T_MultiplicativeOp;
  visitFactor1(a: Token): T_Factor;
  visitFactor2(a: Token): T_Factor;
  visitFactor3(a: Token): T_Factor;
  visitFactor4(a: Token): T_Factor;
  visitFactor5(a: Token): T_Factor;
  visitFactor6(a1: T_UnaryOp, a2: T_Factor): T_Factor;
  visitFactor7(a1: Token, a2: T_Expression, a3: Token): T_Factor;
  visitFactor8(
    a1: Token,
    a2:
      | [Token, [T_Expression, Array<[Token, T_Expression]>] | undefined, Token]
      | undefined,
  ): T_Factor;
  visitUnaryOp1(a: Token): T_UnaryOp;
  visitUnaryOp2(a: Token): T_UnaryOp;
  visitUnaryOp3(a: Token): T_UnaryOp;
}

export const parseProgram = <
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
  T_UnaryOp,
>(
  input: string,
  visitor: Visitor<
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
  >,
): Either<SyntaxError, T_Program> => {
  try {
    return right(mkParser(mkScanner(input), visitor).program());
  } catch (e) {
    return left(e);
  }
};

export const mkParser = <
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
  T_UnaryOp,
>(
  scanner: Scanner,
  visitor: Visitor<
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
  >,
) => {
  const matchToken = (ttoken: TToken): Token => {
    if (isToken(ttoken)) {
      return nextToken();
    } else {
      throw {
        tag: "SyntaxError",
        found: scanner.current(),
        expected: [ttoken],
      };
    }
  };

  const isToken = (ttoken: TToken): boolean => currentToken() === ttoken;

  const isTokens = (ttokens: Array<TToken>): boolean =>
    ttokens.includes(currentToken());

  const currentToken = (): TToken => scanner.current()[0];

  const nextToken = (): Token => {
    const result = scanner.current();
    scanner.next();
    return result;
  };

  return {
    program: function (): T_Program {
      const a: Array<(T_VariableDeclaration | T_FunctionDeclaration)> = [];

      while (isTokens([TToken.Const, TToken.Let, TToken.Fun])) {
        let at: T_VariableDeclaration | T_FunctionDeclaration;
        if (isTokens([TToken.Const, TToken.Let])) {
          const att: T_VariableDeclaration = this.variableDeclaration();
          at = att;
        } else if (isToken(TToken.Fun)) {
          const att: T_FunctionDeclaration = this.functionDeclaration();
          at = att;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.Const, TToken.Let, TToken.Fun],
          };
        }
        a.push(at);
      }
      return visitor.visitProgram(a);
    },
    variableDeclaration: function (): T_VariableDeclaration {
      let a1: Token | Token;
      if (isToken(TToken.Const)) {
        const a1t: Token = matchToken(TToken.Const);
        a1 = a1t;
      } else if (isToken(TToken.Let)) {
        const a1t: Token = matchToken(TToken.Let);
        a1 = a1t;
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Const, TToken.Let],
        };
      }
      const a2: Token = matchToken(TToken.Identifier);
      const a3: Token = matchToken(TToken.Equal);
      const a4: T_LiteralExpression = this.literalExpression();
      const a5: Token = matchToken(TToken.Semicolon);
      return visitor.visitVariableDeclaration(a1, a2, a3, a4, a5);
    },
    literalExpression: function (): T_LiteralExpression {
      if (isToken(TToken.True)) {
        return visitor.visitLiteralExpression1(matchToken(TToken.True));
      } else if (isToken(TToken.False)) {
        return visitor.visitLiteralExpression2(matchToken(TToken.False));
      } else if (
        isTokens(
          [TToken.LiteralInt, TToken.LiteralFloat, TToken.Plus, TToken.Dash],
        )
      ) {
        let a1: (Token | Token) | undefined = undefined;

        if (isTokens([TToken.Plus, TToken.Dash])) {
          let a1t: Token | Token;
          if (isToken(TToken.Plus)) {
            const a1tt: Token = matchToken(TToken.Plus);
            a1t = a1tt;
          } else if (isToken(TToken.Dash)) {
            const a1tt: Token = matchToken(TToken.Dash);
            a1t = a1tt;
          } else {
            throw {
              tag: "SyntaxError",
              found: scanner.current(),
              expected: [TToken.Plus, TToken.Dash],
            };
          }
          a1 = a1t;
        }
        let a2: Token | Token;
        if (isToken(TToken.LiteralInt)) {
          const a2t: Token = matchToken(TToken.LiteralInt);
          a2 = a2t;
        } else if (isToken(TToken.LiteralFloat)) {
          const a2t: Token = matchToken(TToken.LiteralFloat);
          a2 = a2t;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.LiteralInt, TToken.LiteralFloat],
          };
        }
        return visitor.visitLiteralExpression3(a1, a2);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.True,
            TToken.False,
            TToken.LiteralInt,
            TToken.LiteralFloat,
            TToken.Plus,
            TToken.Dash,
          ],
        };
      }
    },
    functionDeclaration: function (): T_FunctionDeclaration {
      const a1: Token = matchToken(TToken.Fun);
      const a2: Token = matchToken(TToken.Identifier);
      const a3: Token = matchToken(TToken.LParen);
      let a4:
        | [T_TypedIdentifier, Array<[Token, T_TypedIdentifier]>]
        | undefined = undefined;

      if (isToken(TToken.Identifier)) {
        const a4t1: T_TypedIdentifier = this.typedIdentifier();
        const a4t2: Array<[Token, T_TypedIdentifier]> = [];

        while (isToken(TToken.Comma)) {
          const a4t2t1: Token = matchToken(TToken.Comma);
          const a4t2t2: T_TypedIdentifier = this.typedIdentifier();
          const a4t2t: [Token, T_TypedIdentifier] = [a4t2t1, a4t2t2];
          a4t2.push(a4t2t);
        }
        const a4t: [T_TypedIdentifier, Array<[Token, T_TypedIdentifier]>] = [
          a4t1,
          a4t2,
        ];
        a4 = a4t;
      }
      const a5: Token = matchToken(TToken.RParen);
      const a6: T_FunctionDeclarationSuffix = this.functionDeclarationSuffix();
      return visitor.visitFunctionDeclaration(a1, a2, a3, a4, a5, a6);
    },
    functionDeclarationSuffix: function (): T_FunctionDeclarationSuffix {
      if (isToken(TToken.Colon)) {
        const a1: Token = matchToken(TToken.Colon);
        const a2: T_Type = this.type();
        const a3: Token = matchToken(TToken.LCurly);
        const a4: Array<T_Statement> = [];

        while (
          isTokens(
            [
              TToken.Const,
              TToken.Let,
              TToken.If,
              TToken.While,
              TToken.LCurly,
              TToken.Identifier,
              TToken.Semicolon,
            ],
          )
        ) {
          const a4t: T_Statement = this.statement();
          a4.push(a4t);
        }
        const a5: Token = matchToken(TToken.Return);
        const a6: T_Expression = this.expression();
        const a7: Token = matchToken(TToken.Semicolon);
        const a8: Token = matchToken(TToken.RCurly);
        return visitor.visitFunctionDeclarationSuffix1(
          a1,
          a2,
          a3,
          a4,
          a5,
          a6,
          a7,
          a8,
        );
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        const a2: Array<T_Statement> = [];

        while (
          isTokens(
            [
              TToken.Const,
              TToken.Let,
              TToken.If,
              TToken.While,
              TToken.LCurly,
              TToken.Identifier,
              TToken.Semicolon,
            ],
          )
        ) {
          const a2t: T_Statement = this.statement();
          a2.push(a2t);
        }
        const a3: Token = matchToken(TToken.RCurly);
        return visitor.visitFunctionDeclarationSuffix2(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Colon, TToken.LCurly],
        };
      }
    },
    type: function (): T_Type {
      if (isToken(TToken.Int)) {
        return visitor.visitType1(matchToken(TToken.Int));
      } else if (isToken(TToken.Float)) {
        return visitor.visitType2(matchToken(TToken.Float));
      } else if (isToken(TToken.Bool)) {
        return visitor.visitType3(matchToken(TToken.Bool));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Int, TToken.Float, TToken.Bool],
        };
      }
    },
    typedIdentifier: function (): T_TypedIdentifier {
      const a1: Token = matchToken(TToken.Identifier);
      const a2: Token = matchToken(TToken.Colon);
      const a3: T_Type = this.type();
      return visitor.visitTypedIdentifier(a1, a2, a3);
    },
    statement: function (): T_Statement {
      if (isTokens([TToken.Const, TToken.Let])) {
        let a1: Token | Token;
        if (isToken(TToken.Const)) {
          const a1t: Token = matchToken(TToken.Const);
          a1 = a1t;
        } else if (isToken(TToken.Let)) {
          const a1t: Token = matchToken(TToken.Let);
          a1 = a1t;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.Const, TToken.Let],
          };
        }
        const a2: Token = matchToken(TToken.Identifier);
        const a3: Token = matchToken(TToken.Equal);
        const a4: T_Expression = this.expression();
        const a5: Token = matchToken(TToken.Semicolon);
        return visitor.visitStatement1(a1, a2, a3, a4, a5);
      } else if (isToken(TToken.If)) {
        const a1: Token = matchToken(TToken.If);
        const a2: T_Expression = this.expression();
        const a3: T_Statement = this.statement();
        let a4: [Token, T_Statement] | undefined = undefined;

        if (isToken(TToken.Else)) {
          const a4t1: Token = matchToken(TToken.Else);
          const a4t2: T_Statement = this.statement();
          const a4t: [Token, T_Statement] = [a4t1, a4t2];
          a4 = a4t;
        }
        return visitor.visitStatement2(a1, a2, a3, a4);
      } else if (isToken(TToken.While)) {
        const a1: Token = matchToken(TToken.While);
        const a2: T_Expression = this.expression();
        const a3: T_Statement = this.statement();
        return visitor.visitStatement3(a1, a2, a3);
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        const a2: Array<T_Statement> = [];

        while (
          isTokens(
            [
              TToken.Const,
              TToken.Let,
              TToken.If,
              TToken.While,
              TToken.LCurly,
              TToken.Identifier,
              TToken.Semicolon,
            ],
          )
        ) {
          const a2t: T_Statement = this.statement();
          a2.push(a2t);
        }
        const a3: Token = matchToken(TToken.RCurly);
        return visitor.visitStatement4(a1, a2, a3);
      } else if (isToken(TToken.Identifier)) {
        const a1: Token = matchToken(TToken.Identifier);
        let a2: [
          Token,
          [T_Expression, Array<[Token, T_Expression]>] | undefined,
          Token,
        ] | [Token, T_Expression];
        if (isToken(TToken.LParen)) {
          const a2t1: Token = matchToken(TToken.LParen);
          let a2t2: [T_Expression, Array<[Token, T_Expression]>] | undefined =
            undefined;

          if (
            isTokens(
              [
                TToken.LiteralInt,
                TToken.LiteralFloat,
                TToken.LiteralString,
                TToken.True,
                TToken.False,
                TToken.LParen,
                TToken.Identifier,
                TToken.Bang,
                TToken.Dash,
                TToken.Plus,
              ],
            )
          ) {
            const a2t2t1: T_Expression = this.expression();
            const a2t2t2: Array<[Token, T_Expression]> = [];

            while (isToken(TToken.Comma)) {
              const a2t2t2t1: Token = matchToken(TToken.Comma);
              const a2t2t2t2: T_Expression = this.expression();
              const a2t2t2t: [Token, T_Expression] = [a2t2t2t1, a2t2t2t2];
              a2t2t2.push(a2t2t2t);
            }
            const a2t2t: [T_Expression, Array<[Token, T_Expression]>] = [
              a2t2t1,
              a2t2t2,
            ];
            a2t2 = a2t2t;
          }
          const a2t3: Token = matchToken(TToken.RParen);
          const a2t: [
            Token,
            [T_Expression, Array<[Token, T_Expression]>] | undefined,
            Token,
          ] = [a2t1, a2t2, a2t3];
          a2 = a2t;
        } else if (isToken(TToken.Equal)) {
          const a2t1: Token = matchToken(TToken.Equal);
          const a2t2: T_Expression = this.expression();
          const a2t: [Token, T_Expression] = [a2t1, a2t2];
          a2 = a2t;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.LParen, TToken.Equal],
          };
        }
        const a3: Token = matchToken(TToken.Semicolon);
        return visitor.visitStatement5(a1, a2, a3);
      } else if (isToken(TToken.Semicolon)) {
        return visitor.visitStatement6(matchToken(TToken.Semicolon));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.Const,
            TToken.Let,
            TToken.If,
            TToken.While,
            TToken.LCurly,
            TToken.Identifier,
            TToken.Semicolon,
          ],
        };
      }
    },
    expression: function (): T_Expression {
      const a1: T_OrExpression = this.orExpression();
      let a2: [Token, T_Expression, Token, T_Expression] | undefined =
        undefined;

      if (isToken(TToken.Question)) {
        const a2t1: Token = matchToken(TToken.Question);
        const a2t2: T_Expression = this.expression();
        const a2t3: Token = matchToken(TToken.Colon);
        const a2t4: T_Expression = this.expression();
        const a2t: [Token, T_Expression, Token, T_Expression] = [
          a2t1,
          a2t2,
          a2t3,
          a2t4,
        ];
        a2 = a2t;
      }
      return visitor.visitExpression(a1, a2);
    },
    orExpression: function (): T_OrExpression {
      const a1: T_AndExpression = this.andExpression();
      const a2: Array<[Token, T_AndExpression]> = [];

      while (isToken(TToken.BarBar)) {
        const a2t1: Token = matchToken(TToken.BarBar);
        const a2t2: T_AndExpression = this.andExpression();
        const a2t: [Token, T_AndExpression] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitOrExpression(a1, a2);
    },
    andExpression: function (): T_AndExpression {
      const a1: T_RelationalExpression = this.relationalExpression();
      const a2: Array<[Token, T_RelationalExpression]> = [];

      while (isToken(TToken.AmpersandAmpersand)) {
        const a2t1: Token = matchToken(TToken.AmpersandAmpersand);
        const a2t2: T_RelationalExpression = this.relationalExpression();
        const a2t: [Token, T_RelationalExpression] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitAndExpression(a1, a2);
    },
    relationalExpression: function (): T_RelationalExpression {
      const a1: T_AdditiveExpression = this.additiveExpression();
      let a2: [T_RelationalOp, T_AdditiveExpression] | undefined = undefined;

      if (
        isTokens(
          [
            TToken.EqualEqual,
            TToken.BangEqual,
            TToken.LessThanEqual,
            TToken.LessThan,
            TToken.GreaterThanEqual,
            TToken.GreaterThan,
          ],
        )
      ) {
        const a2t1: T_RelationalOp = this.relationalOp();
        const a2t2: T_AdditiveExpression = this.additiveExpression();
        const a2t: [T_RelationalOp, T_AdditiveExpression] = [a2t1, a2t2];
        a2 = a2t;
      }
      return visitor.visitRelationalExpression(a1, a2);
    },
    relationalOp: function (): T_RelationalOp {
      if (isToken(TToken.EqualEqual)) {
        return visitor.visitRelationalOp1(matchToken(TToken.EqualEqual));
      } else if (isToken(TToken.BangEqual)) {
        return visitor.visitRelationalOp2(matchToken(TToken.BangEqual));
      } else if (isToken(TToken.LessThanEqual)) {
        return visitor.visitRelationalOp3(matchToken(TToken.LessThanEqual));
      } else if (isToken(TToken.LessThan)) {
        return visitor.visitRelationalOp4(matchToken(TToken.LessThan));
      } else if (isToken(TToken.GreaterThanEqual)) {
        return visitor.visitRelationalOp5(matchToken(TToken.GreaterThanEqual));
      } else if (isToken(TToken.GreaterThan)) {
        return visitor.visitRelationalOp6(matchToken(TToken.GreaterThan));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.EqualEqual,
            TToken.BangEqual,
            TToken.LessThanEqual,
            TToken.LessThan,
            TToken.GreaterThanEqual,
            TToken.GreaterThan,
          ],
        };
      }
    },
    additiveExpression: function (): T_AdditiveExpression {
      const a1: T_MultiplicativeExpression = this.multiplicativeExpression();
      const a2: Array<[T_AdditiveOp, T_MultiplicativeExpression]> = [];

      while (isTokens([TToken.Plus, TToken.Dash])) {
        const a2t1: T_AdditiveOp = this.additiveOp();
        const a2t2: T_MultiplicativeExpression = this
          .multiplicativeExpression();
        const a2t: [T_AdditiveOp, T_MultiplicativeExpression] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitAdditiveExpression(a1, a2);
    },
    additiveOp: function (): T_AdditiveOp {
      if (isToken(TToken.Plus)) {
        return visitor.visitAdditiveOp1(matchToken(TToken.Plus));
      } else if (isToken(TToken.Dash)) {
        return visitor.visitAdditiveOp2(matchToken(TToken.Dash));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Plus, TToken.Dash],
        };
      }
    },
    multiplicativeExpression: function (): T_MultiplicativeExpression {
      const a1: T_Factor = this.factor();
      const a2: Array<[T_MultiplicativeOp, T_Factor]> = [];

      while (isTokens([TToken.Star, TToken.Slash])) {
        const a2t1: T_MultiplicativeOp = this.multiplicativeOp();
        const a2t2: T_Factor = this.factor();
        const a2t: [T_MultiplicativeOp, T_Factor] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitMultiplicativeExpression(a1, a2);
    },
    multiplicativeOp: function (): T_MultiplicativeOp {
      if (isToken(TToken.Star)) {
        return visitor.visitMultiplicativeOp1(matchToken(TToken.Star));
      } else if (isToken(TToken.Slash)) {
        return visitor.visitMultiplicativeOp2(matchToken(TToken.Slash));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Star, TToken.Slash],
        };
      }
    },
    factor: function (): T_Factor {
      if (isToken(TToken.LiteralInt)) {
        return visitor.visitFactor1(matchToken(TToken.LiteralInt));
      } else if (isToken(TToken.LiteralFloat)) {
        return visitor.visitFactor2(matchToken(TToken.LiteralFloat));
      } else if (isToken(TToken.LiteralString)) {
        return visitor.visitFactor3(matchToken(TToken.LiteralString));
      } else if (isToken(TToken.True)) {
        return visitor.visitFactor4(matchToken(TToken.True));
      } else if (isToken(TToken.False)) {
        return visitor.visitFactor5(matchToken(TToken.False));
      } else if (isTokens([TToken.Bang, TToken.Dash, TToken.Plus])) {
        const a1: T_UnaryOp = this.unaryOp();
        const a2: T_Factor = this.factor();
        return visitor.visitFactor6(a1, a2);
      } else if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        const a2: T_Expression = this.expression();
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitFactor7(a1, a2, a3);
      } else if (isToken(TToken.Identifier)) {
        const a1: Token = matchToken(TToken.Identifier);
        let a2: [
          Token,
          [T_Expression, Array<[Token, T_Expression]>] | undefined,
          Token,
        ] | undefined = undefined;

        if (isToken(TToken.LParen)) {
          const a2t1: Token = matchToken(TToken.LParen);
          let a2t2: [T_Expression, Array<[Token, T_Expression]>] | undefined =
            undefined;

          if (
            isTokens(
              [
                TToken.LiteralInt,
                TToken.LiteralFloat,
                TToken.LiteralString,
                TToken.True,
                TToken.False,
                TToken.LParen,
                TToken.Identifier,
                TToken.Bang,
                TToken.Dash,
                TToken.Plus,
              ],
            )
          ) {
            const a2t2t1: T_Expression = this.expression();
            const a2t2t2: Array<[Token, T_Expression]> = [];

            while (isToken(TToken.Comma)) {
              const a2t2t2t1: Token = matchToken(TToken.Comma);
              const a2t2t2t2: T_Expression = this.expression();
              const a2t2t2t: [Token, T_Expression] = [a2t2t2t1, a2t2t2t2];
              a2t2t2.push(a2t2t2t);
            }
            const a2t2t: [T_Expression, Array<[Token, T_Expression]>] = [
              a2t2t1,
              a2t2t2,
            ];
            a2t2 = a2t2t;
          }
          const a2t3: Token = matchToken(TToken.RParen);
          const a2t: [
            Token,
            [T_Expression, Array<[Token, T_Expression]>] | undefined,
            Token,
          ] = [a2t1, a2t2, a2t3];
          a2 = a2t;
        }
        return visitor.visitFactor8(a1, a2);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.LiteralInt,
            TToken.LiteralFloat,
            TToken.LiteralString,
            TToken.True,
            TToken.False,
            TToken.Bang,
            TToken.Dash,
            TToken.Plus,
            TToken.LParen,
            TToken.Identifier,
          ],
        };
      }
    },
    unaryOp: function (): T_UnaryOp {
      if (isToken(TToken.Bang)) {
        return visitor.visitUnaryOp1(matchToken(TToken.Bang));
      } else if (isToken(TToken.Dash)) {
        return visitor.visitUnaryOp2(matchToken(TToken.Dash));
      } else if (isToken(TToken.Plus)) {
        return visitor.visitUnaryOp3(matchToken(TToken.Plus));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Bang, TToken.Dash, TToken.Plus],
        };
      }
    },
  };
};

export type SyntaxError = {
  tag: "SyntaxError";
  found: Token;
  expected: Array<TToken>;
};
