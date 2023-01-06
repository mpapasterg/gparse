# gparse

**gparse** is a **Parser Combinator** library in Typescript that enables the creation of efficient and reliable parsers for *any* possible **Context Free Grammar (CFG)**.

## Feature list

- 0 external dependencies.
- Tested using BDD concepts.
- Rich documentation using [TSDoc](https://tsdoc.org/) and [TypeDoc](https://typedoc.org/) [here].
- Minimal parser combinator set.
- Best (known) time complexities on all parser combinator implementations.
- Can create parsers for any CFG grammar.
- Full support for semantic data and parse tree generation.
- Includes error recovery capabilites.

## Installation

**gparse** is available on **npm** and can be installed via:

```bash
    npm install gparse
```

## Usage

A **simple calculator** in **gparse** can be implemented as follows:

```typescript
import * as gparse from 'gparse';

// Error definitions
const eof = new gparse.StaticSemantics("EOF", null);
const match = new gparse.StaticSemantics("match", null);
const divideByZeroError = new gparse.StaticSemantics('', "DivideByZeroError");

// Token definitions

const number: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.map(gparse.regex(/^[0-9]+/, (_) => eof, () => match), (state) => new gparse.StaticSemantics('', +state.result[state.result.length - 1]), (state) => state.error));
const lparen: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("(", (_) => eof, (_) => match));
const rparen: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str(")", (_) => eof, (_) => match));
const addOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("+", (_) => eof, (_) => match));
const minusOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("-", (_) => eof, (_) => match));
const multiplyOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("*", (_) => eof, (_) => match));
const divideOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("/", (_) => eof, (_) => match));

// Symbols

const primary: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
    number,
    gparse.chain([lparen, expression, rparen], (data) => {
        return new gparse.StaticSemantics('', data[2].value);
    }),
]));
const term: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
    gparse.chain([term, multiplyOp, primary], (data) => {
        return new gparse.StaticSemantics('', data[0].value * data[2].value);
    }),
    gparse.chain([term, divideOp, gparse.assert(primary, (state) => {
                if (!state.isError && state.data.value === 0) {
                    return divideByZeroError;
                } else {
                    return null;
                }
            })], (data) => {
        return new gparse.StaticSemantics('', data[0].value / data[2].value);
    }),
    primary,
]));
const expression: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
    gparse.chain([expression, addOp, term], (data) => {
        return new gparse.StaticSemantics('', data[0].value + data[2].value);
    }),
    gparse.chain([expression, minusOp, term], (data) => {
        return new gparse.StaticSemantics('', data[0].value - data[2].value);
    }),
    term,
]));

console.log("1+2-3+4*5-10/5");  // 18

```

Full documentation on the library can be found [here](https://mpapasterg.github.io/gparse/).

Also, a **Cookbook** with many more examples is under developement.

## Status

Status: Beta

It is suggested that it is NOT used in production before it reaches stable, as there may be critical bugs that I am unaware of.

## Credits

**gparse** was heavily inspired by the work of [arcsecond](https://github.com/francisrstokes/arcsecond). The modified functional version of the *GLL* parsing algorithm is inspired by [this](https://github.com/epsil/gll/blob/master/article/index.md#spiewak10-generalized).

## Bibliography

- [Generalized Parser Combinators (link only)](https://dinhe.net/~aredridel/.notmine/PDFs/Parsing/SPIEWAK%2C%20Daniel%20%282010%29%20-%20Generalized%20Parser%20Combinators.pdf)
- [Memoisation in Top-down parsing](https://dl.acm.org/doi/10.5555/216261.216269)
- [Parser Combinators for Ambiguous Left-Recursive Grammars](https://doi.org/10.1007/978-3-540-77442-6_12)
- [Purely functional GLL parsing](https://doi.org/10.1016/j.cola.2020.100945)
- [Modelling GLL Parser Implementations](https://doi.org/10.1007/978-3-642-19440-5_4)

## License

**gparse** is made available under the **MIT License**. A copy of the license can be found in the project's repo.
