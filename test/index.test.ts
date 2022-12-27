import * as gparse from './../src/index';

describe("ParseState validity at creation", () => {

    it("Should be valid", () => {
        const result = new gparse.ParseResult<gparse.NoSemantics>("ASDF", 2, ["AS"], new gparse.NoSemantics());
        expect(result.target).toStrictEqual("ASDF");
        expect(result.index).toStrictEqual(2);
        expect(result.isError).toStrictEqual(false);
        expect(result.result).toStrictEqual(["AS"]);
        expect(result.data.identity).toStrictEqual('');
    });
    it("Should throw error on index greater than target", () => {
        expect(() => new gparse.ParseResult("ASDF", 4, ["ASDF"], new gparse.NoSemantics())).not.toThrow(RangeError);
        expect(() => new gparse.ParseResult("ASDF", 5, ["ASDF"], new gparse.NoSemantics())).toThrow(RangeError);
    });
    it("Should throw error on result greater target index.", () => {
        expect(() => new gparse.ParseResult("ASDF", 2, ["AS"], new gparse.NoSemantics())).not.toThrow(RangeError);
        expect(() => new gparse.ParseResult("ASDF", 3, ["ASDF"], new gparse.NoSemantics())).toThrow(RangeError);
    });

});

describe("Semantics classes check", () => {

    it("NoSemantics should always have same identity.", () => {
        const a = new gparse.NoSemantics();
        const b = new gparse.NoSemantics();
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("NoSemantics have same identities with SameSemantics", () => {
        const a = new gparse.NoSemantics();
        const b = new gparse.SameSemantics({ a: 1 });
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("SameSemantics should have same identity on different data.", () => {
        const a = new gparse.SameSemantics({
            a: 1,
        });
        const b = new gparse.SameSemantics({
            a: 2,
            b: 1,
        });
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("SameSemantics should have same identity on same data.", () => {
        const a = new gparse.SameSemantics({
            a: 1,
        });
        const b = new gparse.SameSemantics({
            a: 1,
        });
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("StaticSemantics should have same identity on different data.", () => {
        const a = new gparse.StaticSemantics("a", {
            a: 1,
        });
        const b = new gparse.StaticSemantics("a", {
            a: 2,
            b: 1,
        });
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("StaticSemantics should have different identity on same data.", () => {
        const a = new gparse.StaticSemantics("a", {
            a: 1,
        });
        const b = new gparse.StaticSemantics("b", {
            a: 1,
        });
        expect(a.identity).not.toStrictEqual(b.identity);
    });
    it("DynamicSemantics should have same identity on same data.", () => {
        const a = new gparse.DynamicSemantics({
            a: 1,
        });
        const b = new gparse.DynamicSemantics({
            a: 1,
        });
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("DynamicSemantics should have different identity on different data.", () => {
        const a = new gparse.DynamicSemantics({
            a: 1,
        });
        const b = new gparse.DynamicSemantics({
            a: 2,
            b: 1,
        });
        expect(a.identity).not.toStrictEqual(b.identity);
    });
    it("DynamicSemantics should update identity.", () => {
        const a = new gparse.DynamicSemantics({
            a: 1,
        });
        const b = new gparse.DynamicSemantics({
            a: 1,
        });
        expect(a.identity).toStrictEqual(b.identity);
        const newValue = {
            a: 1,
            b: 2,
        };
        b.value = newValue;
        expect(a.identity).not.toStrictEqual(b.identity);
        expect(b.identity).toStrictEqual(JSON.stringify(newValue));
    });

});

describe("ParseState identity check", () => {

    it("Should have same identities on same target, index and data identity empty string", () => {
        const a = new gparse.ParseResult("ASDF", 0, [""], new gparse.SameSemantics({ a: 1 }));
        const b = new gparse.ParseResult("ASDF", 0, [""], new gparse.SameSemantics({ a: 2 }));
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("Should have same identities on same target, index and data same", () => {
        const data = new gparse.DynamicSemantics({
            a: 1,
        });
        const a = new gparse.ParseResult("ASDF", 0, [""], data);
        const b = new gparse.ParseResult("ASDF", 0, [""], data);
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("Should have same identities on same target, index and data null", () => {
        const a = new gparse.ParseResult("ASDF", 0, [""], new gparse.NoSemantics());
        const b = new gparse.ParseResult("ASDF", 0, [""], new gparse.NoSemantics());
        expect(a.identity).toStrictEqual(b.identity);
    });
    it("Should have different identities on different targets", () => {
        const a = new gparse.ParseResult("ASDFASDF", 0, [""], new gparse.NoSemantics());
        const b = new gparse.ParseResult("ASDF", 0, [""], new gparse.NoSemantics());
        expect(a.identity).not.toStrictEqual(b.identity);
    });
    it("Should have different identities on different indices", () => {
        const a = new gparse.ParseResult("ASDF", 0, [""], new gparse.NoSemantics());
        const b = new gparse.ParseResult("ASDF", 1, ["A"], new gparse.NoSemantics());
        expect(a.identity).not.toStrictEqual(b.identity);
    });
    it("Should have different identities on different data identity", () => {
        const a = new gparse.ParseResult("ASDF", 0, [""], new gparse.StaticSemantics("a", { a: 1 }));
        const b = new gparse.ParseResult("ASDF", 1, ["A"], new gparse.StaticSemantics("b", { a: 1 }));
        expect(a.identity).not.toStrictEqual(b.identity);
    });
    it("Should have different identities different data contents", () => {
        const d1 = new gparse.DynamicSemantics({
            a: 1,
        });
        const d2 = new gparse.DynamicSemantics({
            a: 2,
            b: 4,
        });
        const a = new gparse.ParseResult("ASDF", 0, [""], d1);
        const b = new gparse.ParseResult("ASDF", 0, [""], d2);
        expect(a.identity).not.toStrictEqual(b.identity);
    });
});

describe("ParseState promise check", () => {

    it("Promise ParseResult should return valid", async () => {
        const a = new gparse.ParseResult("ASDF", 2, ["AS"], new gparse.SameSemantics({
            a: 1,
        }));
        const result = await a.toPromise();
        expect(result).toStrictEqual(a);
    });
    it("Promise ParseError should return valid", async () => {
        const a = new gparse.ParseError("ASDF", 2, ["AS"], new gparse.SameSemantics({
            a: 1,
        }));
        const result = await a.toPromise();
        expect(result).toStrictEqual(a);
    });
});

describe("TokenParser methods check", () => {

    it("Should run properly", () => {
        let result;
        const transformer = (state: gparse.ParseState<any, any>) => {
            result = state;
            return state;
        };
        const a = new gparse.TokenParser(transformer);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)).toStrictEqual([
            result,
        ]);
    });
    it("Should memoise properly", () => {
        let result;
        const transformer = (state: gparse.ParseState<any, any>) => {
            result = state;
            return state;
        };
        const a = new gparse.TokenParser(transformer);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)).toStrictEqual([
            result,
        ]);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)[0]).toBe(result);
    });
    it("Should asyncRun properly", async () => {
        let result;
        const transformer = (state: gparse.ParseState<any, any>) => {
            result = state;
            return state;
        };
        const a = new gparse.TokenParser(transformer);
        const awaited = await a.asyncRun("ASDF", new gparse.NoSemantics());
        expect(awaited).toStrictEqual([
            result,
        ]);
    });
});

describe("SymbolParser methods check", () => {

    it("Should generate lazy SymbolParser", () => {
        const a: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("a", (_) => new gparse.NoSemantics(), (_) => new gparse.NoSemantics()));
        const lazy = gparse.SymbolParser.lazy(() => a);
        expect(lazy.run("", new gparse.NoSemantics())).toStrictEqual(a.run("", new gparse.NoSemantics()));
    });
    it("Should generate multiple different semantic states", () => {
        let r1: any;
        let r2: any;
        const t1 = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            r1 = state;
            continuation(state);
        };
        const t2 = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            r2 = state;
            continuation(state);
        };
        const t = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            parseStack.push([
                t1,
                state,
                continuation,
            ]);
            parseStack.push([
                t2,
                {
                    ...state,
                    data: new gparse.StaticSemantics("b", null),
                },
                continuation,
            ]);
        };
        const a = new gparse.SymbolParser(t);
        const generator = a.generate("ASDF", new gparse.StaticSemantics("a", null), 1);
        expect(generator.next().value).toStrictEqual(r2);
        expect(generator.next().value).toStrictEqual(r1);
        expect(generator.next().done).toBeTruthy();
        expect(r2.data.identity).not.toStrictEqual(r1.data.identity);
    });
    it("Should generate same semantics state once only", () => {
        let r1: any;
        let r2: any;
        const t1 = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            r1 = state;
            continuation(state);
        };
        const t2 = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            r2 = state;
            continuation(state);
        };
        const t = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            parseStack.push([
                t1,
                state,
                continuation,
            ]);
            parseStack.push([
                t2,
                state,
                continuation,
            ]);
        };
        const a = new gparse.SymbolParser(t);
        const generator = a.generate("ASDF", new gparse.NoSemantics(), 1);
        expect(generator.next().value).toStrictEqual(r2);
        expect(generator.next().done).toBeTruthy();
        expect(r2).toStrictEqual(r1);
    });
    it("Should run properly", () => {
        let result: any;
        const transformer = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            result = state;
            continuation(state);
        };
        const a = new gparse.SymbolParser(transformer);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)).toStrictEqual([
            result,
        ]);
    });
    it("Should memoise properly", () => {
        let result: any;
        const transformer = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            result = state;
            continuation(state);
        };
        const a = new gparse.SymbolParser(transformer);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)).toStrictEqual([
            result,
        ]);
        expect(a.run("ASDF", new gparse.NoSemantics(), 1)[0]).toBe(result);
    });
    it("Should asyncRun properly", async () => {
        let result: any;
        const transformer = (state: gparse.ParseState<any, any>, continuation: any, parseStack: any) => {
            result = state;
            continuation(state);
        };
        const a = new gparse.SymbolParser(transformer);
        const awaited = await a.asyncRun("ASDF", new gparse.NoSemantics());
        expect(awaited).toStrictEqual([
            result,
        ]);
    });
});

function runToken<D extends gparse.Identifiable, E extends gparse.Identifiable>(
    parser: gparse.TokenParser<D, E>,
    cases: [{
        target: string,
        data: D,
        index?: number,
    }, ({
        result: string[],
        data: D,
    } | {
        result: string[],
        error: E,
    })][],
): void {
    const results: gparse.ParseState<D, E>[] = [];
    for (let i = 0; i < cases.length; i++) {
        results[i] = parser.run(cases[i][0].target, cases[i][0].data, cases[i][0].index)[0];
        const result = results[i];
        if (result.isError) {
            expect(result.result).toStrictEqual((cases[i][1] as { result: string[], error: E, }).result);
            expect(result.error).toStrictEqual((cases[i][1] as { result: string[], error: E }).error);
        } else {
            expect(result.result).toStrictEqual((cases[i][1] as { result: string[], data: D }).result);
            expect(result.data).toStrictEqual((cases[i][1] as { result: string[], data: D }).data);
        }
    }
}

describe("TokenParser parsers check", () => {

    const eof = new gparse.StaticSemantics("EOF", null);
    const match = new gparse.StaticSemantics("match", null);
    const no = new gparse.NoSemantics();

    const a: gparse.TokenParser<any, any> = gparse.str("a", (_) => eof, (_) => match);
    const b: gparse.TokenParser<any, any> = gparse.str("b", (_) => eof, (_) => match);
    const c: gparse.TokenParser<any, any> = gparse.str("c", (_) => eof, (_) => match);

    it("Test str", () => {
        runToken(
            gparse.str("ab", (_) => eof, (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["ab"],
                    data: no,
                }],
                [{
                    target: "aba",
                    data: no,
                }, {
                    result: ["ab"],
                    data: no,
                }],
            ]
        );
    });
    it("Test regex", () => {
        runToken(
            gparse.regex(/^[A-Za-z]+/, (_) => eof, (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: " ",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "abcd",
                    data: no,
                }, {
                    result: ["abcd"],
                    data: no,
                }],
                [{
                    target: " abcd",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "abcd asdf",
                    data: no,
                }, {
                    result: ["abcd"],
                    data: no,
                }],
            ]
        );
    });
    it("Test many", () => {
        runToken(
            gparse.many(a),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "aaa",
                    data: no,
                }, {
                    result: ["a", "a", "a"],
                    data: no,
                }],
                [{
                    target: "aaab",
                    data: no,
                }, {
                    result: ["a", "a", "a"],
                    data: no,
                }]
            ]
        );
    });
    it("Test many1", () => {
        runToken(
            gparse.many1(a, (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "aaa",
                    data: no,
                }, {
                    result: ["a", "a", "a"],
                    data: no,
                }],
                [{
                    target: "aaab",
                    data: no,
                }, {
                    result: ["a", "a", "a"],
                    data: no,
                }]
            ]
        );
    });
    it("Test optional", () => {
        runToken(
            gparse.optional(a),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "ba",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
            ]
        );
    });
    it("Test until", () => {
        runToken(
            gparse.until(c, (_) => eof),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "abde",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "abdec",
                    data: no,
                }, {
                    result: ["abde"],
                    data: no,
                }],
                [{
                    target: "acb",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }]
            ]
        );
    });
    it("Test choice", () => {
        runToken(
            gparse.choice([a, b], (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "c",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: ["b"],
                    data: no,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
            ]
        );
    });
    it("Choice should output the exact results of other parsers and throw match error if all of them fail.", () => {
        runToken(
            gparse.choice([
                gparse.chain([a, b, c]),
            ], (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "aba",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "abc",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
                [{
                    target: "abca",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
            ]
        )
    });
    it("Choice should resolve ambiguity by following completely the first matching parser", () => {
        runToken(
            gparse.choice([
                gparse.chain([a, b]),
                gparse.many(a),
            ], (_) => match),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a", "b"],
                    data: no,
                }],
                [{
                    target: "aba",
                    data: no,
                }, {
                    result: ["a", "b"],
                    data: no,
                }],
            ]
        )
    });
    it("Test lookahead", () => {
        runToken(
            gparse.lookahead(gparse.regex(/^[A-Za-z]/, (_) => eof, (_) => match), (prev) => (prev.result[prev.result.length - 1] == 'a') ? a : b),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "c",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: ["b"],
                    data: no,
                }],
                [{
                    target: "ba",
                    data: no,
                }, {
                    result: ["b"],
                    data: no,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    data: no,
                }],
            ]
        );
    });
    it("Test sideEffect", () => {
        let state: any;
        const sf = gparse.sideEffect((nextState) => {
            state = nextState;
        });
        let result = sf.run("", no)[0];
        expect(state).toStrictEqual(result);
        result = sf.run("asdf", no)[0];
        expect(state).toStrictEqual(result);
    });
    it("Test error", () => {
        const err = gparse.error((_) => eof);
        const result = err.run("", no)[0];
        expect(result.isError).toBeTruthy();
        expect((result as gparse.ParseError<gparse.StaticSemantics>).error).toStrictEqual(eof);
    });
    it("Error should return error in a chain", () => {
        runToken(
            gparse.chain([a, gparse.error((_) => eof), b]),
            [
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
            ]
        );
    });
    it("Test recovery", () => {
        const rec = gparse.recovery((_) => no);
        const result = rec.run("", eof)[0];
        expect(result.isError).toBeFalsy();
        expect((result as gparse.ParseResult<gparse.StaticSemantics>).data).toStrictEqual(no);
    });
    it("Recovery should continue parsing with result in a chain", () => {
        runToken(
            gparse.chain([a, gparse.recovery((_) => match), b]),
            [
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a", "b"],
                    data: match,
                }],
            ]
        );
    });
    it("Test error recovery", () => {
        const err = gparse.error((_) => eof);
        const rec = gparse.recovery((_) => no);
        runToken(
            gparse.chain([err, rec]),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
                [{
                    target: "asdf",
                    data: no,
                }, {
                    result: [],
                    data: no,
                }],
            ]
        );
    });
    it("Test assert", () => {
        const zero = new gparse.StaticSemantics("0", null);
        runToken(
            gparse.assert(
                gparse.regex(/^[0-9]+/, (_) => eof, () => match),
                (state) => (state.isError || state.result[state.result.length - 1] === '0') ? zero : null,
            ),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "asdf",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "123",
                    data: no,
                }, {
                    result: ["123"],
                    data: no,
                }],
                [{
                    target: "0",
                    data: no,
                }, {
                    result: ["0"],
                    error: zero,
                }],
                [{
                    target: "0123",
                    data: no,
                }, {
                    result: ["0123"],
                    data: no,
                }]
            ]
        )
    });
    it("Test map", () => {
        const ok = new gparse.StaticSemantics("OK", null);
        const err = new gparse.StaticSemantics("ERR", null);
        runToken(
            gparse.map(a, (_) => ok, (_) => err),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: err,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    data: ok,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a"],
                    data: ok,
                }],
            ]
        );
    });
    it("Test chain", () => {
        runToken(
            gparse.chain([a, b, c]),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a", "b"],
                    error: eof,
                }],
                [{
                    target: "aba",
                    data: no,
                }, {
                    result: ["a", "b"],
                    error: match,
                }],
                [{
                    target: "abc",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
                [{
                    target: "abca",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
            ]
        );
    });
    it("Test chain action", () => {
        runToken(
            gparse.chain([a, b], (_) => {
                return match;
            }),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a", "b"],
                    data: match,
                }],
                [{
                    target: "abc",
                    data: no,
                }, {
                    result: ["a", "b"],
                    data: match,
                }],
            ]
        )
    });
    it("Test contextual", () => {
        runToken(
            gparse.contextual(a, function* () {
                yield b;
                yield c;
            }),
            [
                [{
                    target: "",
                    data: no,
                }, {
                    result: [],
                    error: eof,
                }],
                [{
                    target: "a",
                    data: no,
                }, {
                    result: ["a"],
                    error: eof,
                }],
                [{
                    target: "b",
                    data: no,
                }, {
                    result: [],
                    error: match,
                }],
                [{
                    target: "ab",
                    data: no,
                }, {
                    result: ["a", "b"],
                    error: eof,
                }],
                [{
                    target: "aba",
                    data: no,
                }, {
                    result: ["a", "b"],
                    error: match,
                }],
                [{
                    target: "abc",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
                [{
                    target: "abca",
                    data: no,
                }, {
                    result: ["a", "b", "c"],
                    data: no,
                }],
            ]
        );
    });
});

function runSymbol<D extends gparse.Identifiable, E extends gparse.Identifiable>(
    parser: gparse.SymbolParser<D, E>,
    cases: [{
        target: string,
        data: D,
        index?: number,
    }, ({
        result: string[],
        data: D,
    } | {
        result: string[],
        error: E,
    })[]][],
): void {
    const results: gparse.ParseState<D, E>[][] = [];
    for (let i = 0; i < cases.length; i++) {
        results[i] = parser.run(cases[i][0].target, cases[i][0].data, cases[i][0].index);
        for (let j = 0; j < results[i].length; j++) {
            const result = results[i][j];
            if (result.isError) {
                expect(result.result).toStrictEqual((cases[i][1][j] as { result: string[], error: E, }).result);
                expect(result.error).toStrictEqual((cases[i][1][j] as { result: string[], error: E }).error);
            } else {
                expect(result.result).toStrictEqual((cases[i][1][j] as { result: string[], data: D }).result);
                expect(result.data).toStrictEqual((cases[i][1][j] as { result: string[], data: D }).data);
            }
        }
    }
}

describe("SymbolParser parsers check", () => {

    const eof = new gparse.StaticSemantics("EOF", null);
    const match = new gparse.StaticSemantics("match", null);
    const no = new gparse.NoSemantics();

    const a: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("a", (_) => eof, (_) => match));
    const b: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("b", (_) => eof, (_) => match));
    const c: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("c", (_) => eof, (_) => match));

    const ok = new gparse.StaticSemantics("OK", null);
    const err = new gparse.StaticSemantics("ERR", null);

    it("Test empty", () => {
        expect(gparse.empty.run("", no)).toStrictEqual([
            new gparse.ParseResult("", 0, [], no),
        ]);
        expect(gparse.empty.run("asdf", no)).toStrictEqual([
            new gparse.ParseResult("asdf", 0, [], no),
        ]);
    });
    it("Test map", () => {
        runSymbol(
            gparse.map(a, (_) => ok, (_) => err),
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: err,
                    },
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: ok,
                    },
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: ok,
                    },
                ]],
            ]
        );
    });
    it("Test chain", () => {
        runSymbol(
            gparse.chain([a, b, c]),
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: eof,
                    },
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        error: eof,
                    },
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        error: eof,
                    },
                ]],
                [{
                    target: "aba",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        error: match,
                    },
                ]],
                [{
                    target: "abc",
                    data: no,
                }, [
                    {
                        result: ["a", "b", "c"],
                        data: no,
                    },
                ]],
                [{
                    target: "abca",
                    data: no,
                }, [
                    {
                        result: ["a", "b", "c"],
                        data: no,
                    },
                ]],
            ]
        );
    });
    it("Test chain action", () => {
        runSymbol(
            gparse.chain([a, b], (_) => {
                return match;
            }),
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: eof,
                    },
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        error: eof,
                    },
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        data: match,
                    },
                ]],
                [{
                    target: "abc",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        data: match,
                    },
                ]],
            ]
        )
    });
    it("Test contextual", () => {
        runSymbol(
            gparse.contextual(a, function* () {
                yield b;
                yield c;
            }),
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: eof,
                    },
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        error: eof,
                    },
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        error: eof,
                    },
                ]],
                [{
                    target: "aba",
                    data: no,
                }, [
                    {
                        result: ["a", "b"],
                        error: match,
                    },
                ]],
                [{
                    target: "abc",
                    data: no,
                }, [
                    {
                        result: ["a", "b", "c"],
                        data: no,
                    },
                ]],
                [{
                    target: "abca",
                    data: no,
                }, [
                    {
                        result: ["a", "b", "c"],
                        data: no,
                    },
                ]],
            ]
        );
    });
    it("Test symbol", () => {
        const token = gparse.str("a", (_) => eof, (_) => match);
        expect(token.run("", no)).toStrictEqual(a.run("", no));
        expect(token.run("b", no)).toStrictEqual(a.run("b", no));
        expect(token.run("a", no)).toStrictEqual(a.run("a", no));
        expect(token.run("ab", no)).toStrictEqual(a.run("ab", no));
        expect(token.run("aba", no)).toStrictEqual(a.run("aba", no));
    });
    it("Test alternatives", () => {
        runSymbol(
            gparse.alternatives([a, b]),
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: eof,
                    },
                ]],
                [{
                    target: "c",
                    data: no,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    },
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: ["b"],
                        data: no,
                    },
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    },
                ]],
            ]
        );
    });
});

describe("Parser features check", () => {

    const eof = new gparse.StaticSemantics("EOF", null);
    const match = new gparse.StaticSemantics("match", null);
    const no = new gparse.NoSemantics();

    const a: gparse.TokenParser<any, any> = gparse.str("a", (_) => eof, (_) => match);
    const b: gparse.TokenParser<any, any> = gparse.str("b", (_) => eof, (_) => match);
    const OPT = gparse.alternatives([
        gparse.SymbolParser.toSymbol(a),
        gparse.empty,
    ]);

    const recursionResults: any = [
        [{
            target: "",
            data: no,
        }, [
            {
                result: [],
                error: eof,
            },
        ]],
        [{
            target: "a",
            data: no,
        }, [
            {
                result: ["a"],
                data: no,
            },
        ]],
        [{
            target: "aa",
            data: no,
        }, [
            {
                result: ["a", "a"],
                data: no,
            },
        ]],
        [{
            target: "aaa",
            data: no,
        }, [
            {
                result: ["a", "a", "a"],
                data: no,
            },
        ]],
        [{
            target: "ab",
            data: no,
        }, [
            {
                result: ["a"],
                data: no,
            },
        ]],
    ];
    const L: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.chain([L, gparse.SymbolParser.toSymbol(a)]),
        gparse.SymbolParser.toSymbol(a),
    ]));
    const R: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.chain([gparse.SymbolParser.toSymbol(a), R]),
        gparse.SymbolParser.toSymbol(a),
    ]));

    const E: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.chain([gparse.empty, L, gparse.SymbolParser.toSymbol(a)]),
        gparse.SymbolParser.toSymbol(a),
    ]));

    const A = gparse.map(gparse.SymbolParser.toSymbol(gparse.str("a", (_) => eof, (_) => match)), (state) => ({ identity: state.data.identity + 'a' }), (state) => state.error);

    const LR: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.map(gparse.chain([LR, A]), (state) => ({ identity: state.data!.identity + 'l' }), (state) => state.error),
        gparse.map(gparse.chain([A, LR]), (state) => ({ identity: state.data!.identity + 'r' }), (state) => state.error),
        A,
    ]));

    const S: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.map(gparse.chain([S, A, S]), (state) => ({ identity: state.data!.identity + '+' }), (state) => state.error),
        A,
    ]));

    const SSS: gparse.SymbolParser<any, any> = gparse.SymbolParser.lazy(() => gparse.alternatives([
        gparse.map(gparse.chain([SSS, SSS, SSS]), (state) => ({ identity: state.data!.identity + 'SSS' }), (state) => state.error),
        gparse.map(gparse.chain([SSS, SSS]), (state) => ({ identity: state.data!.identity + 'SS' }), (state) => state.error),
        A,
    ]));

    it("Test symbol optional", () => {
        runSymbol(
            OPT,
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        data: no,
                    }
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: [],
                        data: no,
                    }
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    }
                ]],
                [{
                    target: "ab",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    }
                ]],
            ]
        )
    });
    it("Test symbol many (left recursion)", () => {
        runSymbol(
            L,
            recursionResults,
        );
    });
    it("Test symbol many (right recursion)", () => {
        runSymbol(
            R,
            recursionResults,
        );
    });
    it("Test symbol many (left + right recursion)", () => {
        runSymbol(
            gparse.alternatives([
                L,
                R,
            ]),
            recursionResults,
        )
    });
    it("Test direct + indirect recursion", () => {
        runSymbol(
            E,
            recursionResults,
        )
    });
    it("Test symbol many + ambiguity (left + right recursion combined)", () => {
        runSymbol(
            LR,
            [
                [{
                    target: "aaaa",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaaarrr" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaaalrr" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaaralr" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaalalr" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaalral" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaarral" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aaralal" },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: "aalalal" },
                    },
                ]],
            ]
        )
    });
    it("Test ambiguity", () => {
        runSymbol(
            S,
            [
                [{
                    target: "aaaaa",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a", "a", "a", "a", "a"],
                        data: { identity: "aaa+aa+" },
                    },
                    {
                        result: ["a", "a", "a", "a", "a"],
                        data: { identity: "aaaaa++" },
                    },
                ]],
            ]
        );
    });
    it("Test high ambiguity", () => {
        runSymbol(
            SSS,
            [
                [{
                    target: "",
                    data: { identity: '' },
                }, [
                    {
                        result: [],
                        error: eof,
                    }
                ]],
                [{
                    target: "a",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a"],
                        data: { identity: 'a' },
                    }
                ]],
                [{
                    target: "aa",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a", "a"],
                        data: { identity: 'aaSS' },
                    }
                ]],
                [{
                    target: "aaa",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a", "a", "a"],
                        data: { identity: 'aaSSaSS' },
                    },
                    {
                        result: ["a", "a", "a"],
                        data: { identity: 'aaaSSSS' },
                    },
                    {
                        result: ["a", "a", "a"],
                        data: { identity: 'aaaSSS' },
                    }
                ]],
                [{
                    target: "aaaa",
                    data: { identity: '' },
                }, [
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaSSaSSaSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaSSaaSSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaSSaSSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaSSSSaSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaaSSSSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaaSSSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaSSaaSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaSSaSSS' },
                    },
                    {
                        result: ["a", "a", "a", "a"],
                        data: { identity: 'aaaSSSaSS' },
                    },
                ]],
            ]
        )
    });
    it("Test error recovery", () => {
        const recovery = new gparse.StaticSemantics('RECOVERY', null);
        const error = new gparse.StaticSemantics('ERROR', null);
        const withoutRecovery = gparse.alternatives([
            gparse.SymbolParser.toSymbol(a),
            gparse.chain([gparse.SymbolParser.toSymbol(b), gparse.SymbolParser.toSymbol(gparse.error((state) => state.isError ? state.error : error))]),
        ]);
        const withRecovery = gparse.chain([withoutRecovery, gparse.SymbolParser.toSymbol(gparse.recovery((state) => state.isError ? recovery : state.data))]);
        runSymbol(
            withoutRecovery,
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        error: eof,
                    }
                ]],
                [{
                    target: "c",
                    data: no,
                }, [
                    {
                        result: [],
                        error: match,
                    }
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    }
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: ["b"],
                        error: error,
                    }
                ]],
            ],
        );
        runSymbol(
            withRecovery,
            [
                [{
                    target: "",
                    data: no,
                }, [
                    {
                        result: [],
                        data: recovery,
                    }
                ]],
                [{
                    target: "c",
                    data: no,
                }, [
                    {
                        result: [],
                        data: recovery,
                    }
                ]],
                [{
                    target: "a",
                    data: no,
                }, [
                    {
                        result: ["a"],
                        data: no,
                    }
                ]],
                [{
                    target: "b",
                    data: no,
                }, [
                    {
                        result: ["b"],
                        data: recovery,
                    }
                ]],
            ],
        );
    });
    it("Test calculator", () => {
        const initial = new gparse.StaticSemantics('', 0);

        const number: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.map(gparse.regex(/^[0-9]+/, (_) => eof, () => match), (state) => new gparse.StaticSemantics('', +state.result[state.result.length - 1]), (state) => state.error));
        const lparen: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("(", (_) => eof, (_) => match));
        const rparen: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str(")", (_) => eof, (_) => match));
        const addOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("+", (_) => eof, (_) => match));
        const minusOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("-", (_) => eof, (_) => match));
        const multiplyOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("*", (_) => eof, (_) => match));
        const divideOp: gparse.SymbolParser<any, any> = gparse.SymbolParser.toSymbol(gparse.str("/", (_) => eof, (_) => match));

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
            gparse.chain([term, divideOp, primary], (data) => {
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

        runSymbol(
            expression,
            [
                [{
                    target: "",
                    data: initial,
                }, [
                    {
                        result: [],
                        error: eof,
                    }
                ]],
                [{
                    target: "0",
                    data: initial,
                }, [
                    {
                        result: ["0"],
                        data: initial,
                    },
                ]],
                [{
                    target: "123",
                    data: initial,
                }, [
                    {
                        result: ["123"],
                        data: new gparse.StaticSemantics('', 123),
                    },
                ]],
                [{
                    target: "0123",
                    data: initial,
                }, [
                    {
                        result: ["0123"],
                        data: new gparse.StaticSemantics('', 123),
                    },
                ]],
                [{
                    target: "1*2",
                    data: initial,
                }, [
                    {
                        result: ["1", "*", "2"],
                        data: new gparse.StaticSemantics('', 2),
                    },
                ]],
                [{
                    target: "*2",
                    data: initial,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "2*",
                    data: initial,
                }, [
                    {
                        result: ["2", "*"],
                        error: eof,
                    },
                ]],
                [{
                    target: "3+1",
                    data: initial,
                }, [
                    {
                        result: ["3", "+", "1"],
                        data: new gparse.StaticSemantics('', 4),
                    },
                ]],
                [{
                    target: "+1",
                    data: initial,
                }, [
                    {
                        result: [],
                        error: match,
                    },
                ]],
                [{
                    target: "3+",
                    data: initial,
                }, [
                    {
                        result: ["3", "+"],
                        error: eof,
                    },
                ]],
                [{
                    target: "2*3+4",
                    data: initial,
                }, [
                    {
                        result: ["2", "*", "3", "+", "4"],
                        data: new gparse.StaticSemantics('', 10),
                    },
                ]],
                [{
                    target: "4+3*2",
                    data: initial,
                }, [
                    {
                        result: ["4", "+", "3", "*", "2"],
                        data: new gparse.StaticSemantics('', 10),
                    },
                ]],
                [{
                    target: "3*2-4",
                    data: initial,
                }, [
                    {
                        result: ["3", "*", "2", "-", "4"],
                        data: new gparse.StaticSemantics('', 2),
                    },
                ]],
                [{
                    target: "4-3*2",
                    data: initial,
                }, [
                    {
                        result: ["4", "-", "3", "*", "2"],
                        data: new gparse.StaticSemantics('', -2),
                    },
                ]],
                [{
                    target: "4-3/2",
                    data: initial,
                }, [
                    {
                        result: ["4", "-", "3", "/", "2"],
                        data: new gparse.StaticSemantics('', 2.5),
                    },
                ]],
                [{
                    target: "3/2-4",
                    data: initial,
                }, [
                    {
                        result: ["3", "/", "2", "-", "4"],
                        data: new gparse.StaticSemantics('', -2.5),
                    },
                ]],
                [{
                    target: "0/3",
                    data: initial,
                }, [
                    {
                        result: ["0", "/", "3"],
                        data: new gparse.StaticSemantics('', 0),
                    },
                ]],
                [{
                    target: "3/0",
                    data: initial,
                }, [
                    {
                        result: ["3", "/", "0"],
                        data: new gparse.StaticSemantics('', Infinity),
                    },
                ]],
                [{
                    target: "0/0",
                    data: initial,
                }, [
                    {
                        result: ["0", "/", "0"],
                        data: new gparse.StaticSemantics('', NaN),
                    },
                ]],
                [{
                    target: "1+2-3+5*4/5",
                    data: initial,
                }, [
                    {
                        result: ["1", "+", "2", "-", "3", "+", "5", "*", "4", "/", "5"],
                        data: new gparse.StaticSemantics('', 4),
                    }
                ]],
                [{
                    target: "1+2 3",
                    data: initial,
                }, [
                    {
                        result: ["1", "+", "2"],
                        data: new gparse.StaticSemantics('', 3),
                    },
                ]],
                [{
                    target: "(1)",
                    data: initial,
                }, [
                    {
                        result: ["(", "1", ")"],
                        data: new gparse.StaticSemantics('', 1),
                    }
                ]],
                [{
                    target: "((1+2)*3)",
                    data: initial,
                }, [
                    {
                        result: ["(", "(", "1", "+", "2", ")", "*", "3", ")"],
                        data: new gparse.StaticSemantics('', 9),
                    }
                ]],
                [{
                    target: "(5+5)/(1*2)",
                    data: initial,
                }, [
                    {
                        result: ["(", "5", "+", "5", ")", "/", "(", "1", "*", "2", ")"],
                        data: new gparse.StaticSemantics('', 5),
                    }
                ]]
            ],
        );
    });
});