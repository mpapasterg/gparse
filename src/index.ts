/**
 * gparse - A Generalised Parser Combinator library in Typescript that enables the creation of efficient and reliable parsers
 * for *any* possible **Context Free Grammar (CFG)**.
 *
 * @module gparse
 */

/**
 * An interface that requires an {@link identity} getter or a readonly property of *string* type.
 *
 * If a semantic value or error value is provided, it is required to implement this interface so that
 * parse outcomes can be mapped with a single *string* key.
 *
 * Both {@link ParseResult} and {@link ParseError} from {@link ParseState} implement this interface to ensure that all of them are identifiable.
 *
 * The {@link identity} property is heavily used for **localised memoisation** to provide *deep equality
 * checks* across {@link ParseState} objects and not rely on reference cheks by the *===* operator.
 * This is done because a {@link ParseState} with the same results can be produced multiple times from
 * different parsers and must only be memoised once for maximum performance.
 * It is also required when dealing with *semantic data* and *ambiguity* where it is necessary to ensure
 * correctness of the memoisation algorithm.
 *
 * If *no ambiguity* is required, that is, semantic values should not distinguish parse outcomes,
 * then it is suggested to use an *empty string* for the {@link identity} value:
 * ```typescript
 *  {
 *      identity: '',
 *  }
 * ```
 * (If no semantic data is *null*, it is like implementing {@link Identifiable} with an empty identity property)
 *
 * If *maximum essential ambiguity* is required, that is, to match every single alternative structure
 * for semantic data, then it is suggested to use *JSON.stringify* for the {@link identity} value:
 * ```typescript
 *  {
 *      get identity(): string {
 *          return JSON.stringify(this);
 *      }
 *  }
 * ```
 *
 * It is suggested that you use one of the defined *semantics* types provided with the library including:
 * - {@link NoSemantics}: Defines no semantic data
 * - {@link SameSemantics}: Defines semantic data with the same identity
 * - {@link StaticSemantics}: Defines semantic data with a static identity
 * - {@link DynamicSemantics}: Defines semantic data with an identity that corresponds to the exact strucutre of those semantics.
 *
 * @see {@link ParseState}
 *
 * @see {@link NoSemantics}
 * @see {@link SameSemantics}
 * @see {@link StaticSemantics}
 * @see {@link DynamicSemantics}
 *
 * @group Semantics
 */
export interface Identifiable {
    /** An identifier getter that returns a unique string for all objects that implement the interface */
    readonly identity: string;
}

/**
 * A type for no semantic data.
 *
 * No semantic data is provided and is the default type for {@link ParseState} types **D** and **E**.
 * The {@link identity} property required for {@link Identifiable} is implemented to equal the *empty string*.
 *
 * @see {@link ParseState}
 * @see {@link Identifiable}
 *
 * @group Semantics
 */
export class NoSemantics implements Identifiable {

    /** The {@link identity} property to implement {@link Identifiable}. Equals to *empty string* at all times. */
    public readonly identity: string = '';

}

/**
 * A type for semantic data that have the same {@link identity} value and a {@link value} property that
 * holds the semantic information.
 *
 * Semantic data of this type will all have the same value for the {@link identity} property. That value
 * will be initialised and never change thereafter. Thus, all instances of {@link SameSemantics} will
 * have the same {@link identity}.
 *
 * @see {@link Identifiable}
 *
 * @group Semantics
 */
export class SameSemantics implements Identifiable {

    /** The static identifier that is required to implement {@link Identifiable}. */
    public readonly identity: string = '';

    constructor(
        /** The semantic information to be stored. */
        public value: unknown,
    ) { }

}

/**
 * A type for semantic data that have a specified {@link identity} property as an implementation to the
 * {@link Identifiable} interface. It has the {@link identity} property and a {@link value} property
 * that holds the semantic information.
 *
 * A static *string* value is provided for {@link identity} and that is held for the entire existence of
 * the semantic value (it cannot change).
 *
 * @see {@link Identifiable}
 *
 * @group Semantics
 */
export class StaticSemantics implements Identifiable {

    constructor(
        /** The static identifier that is required to implement {@link Identifiable}. */
        public readonly identity: string,
        /** The semantic information to be stored. */
        public value: unknown,
    ) { }

}

/**
 * A type for semantic data that whose {@link identity} property is defined with the *JSON.stringify* function.
 * dynamically, on every change. A {@link value} property holds the semantic information and for that
 * the *JSON.stringify* method is called for the new {@link identity} property.
 *
 * In order for {@link identity} to be updated on every {@link value} change, {@link value} is
 * acceessed via a *getter/setter* interface that does the necessary bookeeping.
 *
 * @see {@link Identifiable}
 *
 * @group Semantics
 */
export class DynamicSemantics implements Identifiable {

    /**
     * The internal identifier state used to keep track of the {@link value} status.
     *
     * It is only assigned implicitly when the setter for {@link value} is called.
     */
    private _identity!: string;

    /**
     * The internal value object to be stored.
     *
     * The interface to it consists of a getter and a setter that updates the {@link _identity}
     * internal property according to the new value.
     */
    private _value!: unknown;

    constructor(
        /** The semantic information to be stored. */
        value: unknown,
    ) {
        this.value = value;
    }

    /**
     * Updates the {@link identity} property by calling *JSON.stringify* on the changed semantic
     * {@link value}.
     */
    set value(value: unknown) {
        this._value = value;
        this._identity = JSON.stringify(this.value);
    }

    /**
     * Accesses the {@link value} property.
     */
    get value(): unknown {
        return this._value;
    }

    /**
     * The actual getter for {@link identity} required for the implementation of {@link Identifiable}.
     */
    get identity(): string {
        return this._identity;
    }
}

/**
 * A class for parse successful results.
 *
 * An object of this type gets returned on parses that matched their {@link target} until some specified {@link index}.
 * Any *semantic value* attached to the parse results during parsing is also returned as the {@link data} payload of the parse result.
 *
 * Inside a {@link ParseResult}, this should always hold true:
 * {@link result}.length <= {@link index} <= {@link target}.length
 *
 * @typeParam D - The type of the **semantic value** stored in {@link data}. It can vary based on the semantics defined while parsing. It must implement {@link Identifiable}
 *
 * @see {@link Identifiable}
 *
 * @group Parsing
 */
export class ParseResult<D extends Identifiable> implements Identifiable {

    public readonly target: string;
    public readonly index: number;
    public readonly isError: false = false;
    public readonly result: string[];
    /** The *semantic value* produced in the parsing process. If no semantics are defined, it defaults to **null**. */
    public readonly data: D;

    constructor(
        target: string,
        index: number,
        result: string[],
        data: D,
    ) {
        if (index > target.length) {
            throw new RangeError("Index specified is greater that the target's length.");
        }
        if (result.join('').length > index) {
            throw new RangeError("Result is larger than index specified.");
        }
        this.target = target;
        this.index = index;
        this.result = result;
        this.data = data ?? new NoSemantics();
    }

    /**
     * Generates a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
     * that will resolve with this {@link ParseResult}.
     *
     * @returns A new [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) wrapper for this {@link ParseResult}.
     */
    toPromise(): Promise<Awaited<ParseResult<D>>> {
        return Promise.resolve(this);
    }

    /**
     * Returns a string identity of the {@link ParseResult}.
     *
     * The following criteria are checked to produce a unique signature and distinguish two
     * {@link ParseResult} instances properly:
     * 1. {@link target}
     * 2. {@link index}
     * 3. {@link data data.identity}
     * It creates the string {@link target} + {@link index} (+ {@link data data.identity} if {@link data} not null
     * and {@link data data.identity} not empty string) to define an identifying string that is used in memotables for
     * {@link TokenParser} and {@link SymbolParser}.
     *
     * @returns A string identity of the {@link ParseResult}.
     *
     * @see {@link TokenParser}
     * @see {@link SymbolParser}
     */
    get identity(): string {
        return `${this.target}_${this.index}` + ((this.data.identity.length > 0) ? `_${this.data.identity}` : '');
    }
}

/**
 * Creates a new {@link ParseResult} from {@link old} with the specified properties.
 *
 * Used to upgrade a {@link ParseState} to a {@link ParseResult} and provide it with new results and semantics.
 *
 * @param old - The old {@link ParseState} to be updated.
 * @param result - The new resulting token value.
 * @param index - The new index cursor
 * @param data - The new semantic value.
 * @returns A new {@link ParseResult} object with the new properties.
 *
 * @group Parsing
 *
 * @internal
 */
function updateParseResult<D extends Identifiable, E extends Identifiable>(
    old: ParseState<D, E>,
    index: number,
    data: D,
    newResult?: string,
): ParseResult<D> {
    return new ParseResult(
        old.target,
        index,
        (newResult) ? [...old.result, newResult] : old.result,
        data,
    );
}

/**
 * A class for parse error results.
 *
 * An object of this type gets returned on parses that tried to match their {@link target} but failed.
 * All parsers that produce errors return an {@link error} semantic value, which specifies the kind of error that occured.
 *
 * @typeParam E - The type of the **error semantic value**, stored in {@link error}. It can vary based on the error semantics defined while parsing. It must implement {@link Identifiable}
 *
 * @see {@link Identifiable}
 *
 * @group Parsing
 */
export class ParseError<E extends Identifiable> implements Identifiable {

    public readonly target: string;
    public readonly index: number;
    public readonly isError: true = true;
    public readonly result: string[];
    /** The *semantic error value* produced in the parsing process. */
    public readonly error: E;

    constructor(
        target: string,
        index: number,
        result: string[],
        error: E,
    ) {
        if (index > target.length) {
            throw new RangeError("Index specified is greater that the target's length.");
        }
        this.target = target;
        this.index = index;
        this.result = result;
        this.error = error ?? new NoSemantics();
    }

    /**
     * Generates a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
     * that will resolve with this {@link ParseError}.
     *
     * @returns A new [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) wrapper for this {@link ParseError}.
     */
    toPromise(): Promise<Awaited<ParseError<E>>> {
        return Promise.resolve(this);
    }

    /**
     * Returns a string identity of the {@link ParseError}.
     *
     * The following criteria are checked to produce a unique signature and distinguish two
     * {@link ParseError} instances properly:
     * 1. {@link target}
     * 2. {@link index}
     * 3. {@link error error.identity}
     * It creates the string {@link target}_{@link index}(_{@link error error.identity} if {@link error} not null
     * and {@link error error.identity} not empty string) to define an identifying string that is used in memotables for
     * {@link TokenParser} and {@link SymbolParser}.
     *
     * @returns A string identity of the {@link ParseError}.
     *
     * @see {@link TokenParser}
     * @see {@link SymbolParser}
     */
    get identity(): string {
        return `${this.target}_${this.index}` + ((this.error.identity.length > 0) ? `_${this.error.identity}` : '');
    }
}

/**
 * Creates a new {@link ParseError} from {@link old} with the specified {@link error} **semantic error value** and possibly a {@link cause}.
 *
 * Used to upgrade a {@link ParseState} to a {@link ParseError} and provide it with new error semantics.
 *
 * @param old       - The old {@link ParseState} to be updated.
 * @param error     - The new semantic error value.
 * @returns A new {@link ParseError} object with the new {@link error} semantic error value.
 *
 * @group Parsing
 *
 * @internal
 */
function updateParseError<D extends Identifiable, E extends Identifiable>(
    old: ParseState<D, E>,
    error: E,
): ParseError<E> {
    return new ParseError(
        old.target,
        old.index,
        old.result,
        error,
    );
}

/**
 * A unified type for the possible outcomes of parsing
 *
 * A parse will output either:
 * 1. A {@link ParseResult} object, signaling a successful match on the target
 * 2. A {@link ParseError} object, signaling an erroneous parse.
 *
 * @group Parsing
 *
 * @internal
 */
export type ParseState<D extends Identifiable, E extends Identifiable> = ParseResult<D> | ParseError<E>;

/**
 * A callback type for error productions.
 * It gets passed the `target` and `index` where an error occured and returns a new
 * semantic error value for it to be added to the returned {@link ParseError} of
 * the parser.
 *
 * It is used as the type of callback for {@link TokenParser} parsers that produce {@link ParseError}
 * outcomes.
 *
 * @typeParam E     - The type of the semantic error value returned.
 * @param target    - The target that was parsed.
 * @param index     - The index in `target` where an error was found.
 * @returns A new semantic error value
 *
 * @see {@link str}
 * @see {@link regex}
 *
 * @group Parsing
 */
export type ParseErrorProduction<E extends Identifiable> = (target: string, index: number) => E;

/**
 * The type of a {@link ParseState} transformer function
 *
 * A function of this type accepts a {@link ParseState} and transforms it to a new {@link ParseState}.
 *
 * It is used as the transformer function for {@link TokenParser}.
 *
 * @param state - The previous state to be transformed
 * @returns The new transformed state
 *
 * @see {@link TokenParser}
*
 * @group Miscelaneous
 *
 * @internal
 */
export type ParseStateTransformer<D extends Identifiable, E extends Identifiable> = (state: ParseState<D, E>) => ParseState<D, E>;

/**
 * A parser with **recursive-descent like** parsing capabilities.
 *
 * It can be used to define any **LL(k)** parser with arbitrary *k* lookahead,
 * but it falls short of recognising grammars with
 * * Recursion
 * * Ambiguity
 * If those capabilities are required, consider using a {@link SymbolParser}.
 *
 * It uses a simple approach to parsing where each parser applies a {@link ParseStateTransformer}
 * to the input {@link ParseState} and returns the result of the {@link ParseStateTransformer} transformation.
 *
 * All parsers of this type resolve their parsing in O(n) linear time to the input. They will all return a single parse
 * result (no ambiguity is supported) or an error.
 *
 * **Localised Memoisation** is employed on the parser level to store intermediate results
 * for specific inputs and prevent recalculations and loops that might occur.
 * There exists an **automatic flush** policy on each parser where the memoisation tables will be
 * flushed each time the target of parsing changes, where it usually means that a new parsing is
 * requested and, thus, the old memoisation table entries are now irrelevant.
 * This is there to prevent heap allocation issues that might occur.
 *
 * @group Parsing
 */
export class TokenParser<D extends Identifiable, E extends Identifiable> {

    /**
     * The state transformer function that performs the parser logic.
     */
    public readonly transformer: ParseStateTransformer<D, E>;

    /**
     * A memoisation table to map {@link ParseState} inputs to {@link ParseState} outputs produced by the parser, for those inputs.
     */
    private memotable: Map<string, ParseState<D, E>> = new Map();

    /**
     * The current target for the current execution.
     *
     * Each execution has a unique target that stays the same during execution.
     * When the target changes, we know that a new execution takes place and can
     * clear the memotable.
     */
    private currentTarget: string = '';

    constructor(
        transformer: ParseStateTransformer<D, E>,
    ) {
        const self = this;
        this.transformer = function (state: ParseState<D, E>): ParseState<D, E> {
            if (state.target !== self.currentTarget) {
                self.currentTarget = state.target;
                self.memotable.clear();
            }
            if (self.memotable.get(state.identity) !== undefined) {
                return self.memotable.get(state.identity)!;
            } else {
                const nextState = transformer(state);
                self.memotable.set(state.identity, nextState);
                return nextState;
            }
        }
    }

    /**
     * Runs `this` parser for the specified input `target`, with optional
     * `index` and `data` semantic value.
     *
     * Returns an array that contains a single {@link ParseState} result for compatibility with the
     * {@link SymbolParser} interface.
     *
     * @param target    - The complete input to be parsed.
     * @param [index]   - An optional initial index in the `target`. Defaults to **0**.
     * @param [data]    - An optional initial semantic value. Defaults to **null**
     * @returns An array containing a single {@link ParseState} with the parse result or an error.
     */
    run(
        target: string,
        data: D,
        index?: number,
    ): ParseState<D, E>[] {
        return [this.transformer(new ParseResult<D>(target, index ?? 0, [], data))];
    }

    /**
     * Runs the parser for the specified `target` and optional `index` and `data` *asynchronously*
     *
     * Returns a promise that resolves to an array that contains a single {@link ParseState} result for compatibility with the {@link SymbolParser} interface.
     *
     * @param target    - The complete input to be parsed.
     * @param [index]   - An optional initial index in the `target`. Defaults to **0**.
     * @param [data]    - An optional initial semantic value. Defaults to **null**
     * @returns A promise which resolves to an array containing a single {@link ParseState} with the parse result or an error.
     */
    async asyncRun(
        target: string,
        data: D,
        index?: number,
    ): Promise<ParseState<D, E>[]> {
        return [await this.transformer(new ParseResult<D>(target, index ?? 0, [], data)).toPromise()];
    }

}

/**
 * The type of a continuation.
 *
 * **Continuation-Passing style:** Instead of returning transformation results (like with {@link ParseStateTransformer}),
 * the transformed {@link ParseState} is passed to a continuation. The continuation then will get the new transformed
 * {@link ParseState} and execute **side-effects**.
 * **Continuation:** A function that accepts a `state` and executes **side-effects** with it.
 *
 * The continuation used is often defined at the start of a parse and it's goal is to register any `state`
 * passed into it to a *results* array, so that those results will then be returned together.
 *
 * It is used in {@link ContinuationParseStateTransformer} functions, where it is executed with the transformed state
 * from the state transformer.
 *
 * @param state - The previous state to be transformed
 *
 * @see {@link ParseState}
 * @see {@link ContinuationParseStateTransformer}
 * @see {@link SymbolParser}
 *
 * @group Miscelaneous
 *
 * @internal
 */
export type Continuation<D extends Identifiable, E extends Identifiable> = (state: ParseState<D, E>) => void;

/**
 * The type of a {@link ParseState} transformer function in the **continuation-passing style**
 *
 * A function of this type accepts a {@link ParseState} along with a {@link Continuation} and a {@link ParseStack}.
 * When executed, it transforms the `state` passed and calls
 * `continuation` with the new transformed state.
 *
 * It is used as the transformer function for {@link SymbolParser}.
 *
 * @param state         - The previous state to be transformed
 * @param continuation  - The continuation that will transform `state` when executed.
 * @param parseStack    - The parse stack of the parsing.
 *
 * @see {@link Continuation}
 * @see {@link ParseState}
 * @see {@link SymbolParser}
 *
 * @group Miscelaneous
 *
 * @internal
 */
export type ContinuationParseStateTransformer<D extends Identifiable, E extends Identifiable> = (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>) => void;


/**
 * The type of a parse stack
 *
 * A **parse stack** is used in a {@link SymbolParser} to hold references to {@link ContinuationParseStateTransformer}
 * functions, along with their {@link Continuation} and {@link ParseState} object, which are supposed to be passed to them
 * so that they do not need to be called immediately. Instead, their execution can be *deferred* for later execution, if needed.
 *
 * When a {@link ContinuationParseStateTransformer} needs to be dispatched, it is instead pushed to the {@link ParseStack}
 * with the {@link Continuation} and {@link ParseStack} that was to be passed to it.
 * Then, when new parse results are requested, those state transformers are popped from the parse stack to be executed
 *
 * The *stack* nature of the parser storage implies that DFS is implemented in the grammar space. If this parser storage
 * were to be implemented with a *queue*, then BFS would be implemented but that would lead severe perfornamce losses
 * on the general cases.
 *
 * @see {@link ContinuationParseStateTransformer}
 * @see {@link Continuation}
 * @see {@link ParseState}
 * @see {@link SymbolParser}
 *
 * @group Miscelaneous
 *
 * @internal
 */
export type ParseStack<D extends Identifiable, E extends Identifiable> = [ContinuationParseStateTransformer<D, E>, ParseState<D, E>, Continuation<D, E>][];

/**
 * A parser that augments the capabilities of {@link TokenParser} to recognise grammars with:
 * * Recursion
 * * Ambiguity
 * When simpler grammars are to be parsed, that do not involve recursion or ambiguity, it is suggested to use
 * a {@link TokenParser} instead.
 *
 * It can be used to define any **Generalised LL (GLL)** parser
 *
 * It uses a {@link ParseStack} stack structure along with **localised bookeeping** to provide the capabilities needed
 * for **GLL** parsing.
 * **Localised Bookeeping**: An alternative to the **Graph Structured Stack (GSS)** needed for **GLL** parsing.
 * Each parser uses **localised memoisation** to map parse inputs to outputs produced by the parser and continuations that
 * act on those outputs, assigned to the parser's {@link ContinuationParseStateTransformer} funtions over the execution.
 * It also checks the {@link ParseStack} before pushing it's {@link ContinuationParseStateTransformer}, so that it does not
 * gets executed twice for the same data.
 * This effectively makes the parser act as a localised **GSS** node and eliminates the need for more centeralised data
 * structures, while achieving the O(n^3) desired complexity the **GSS** data structure promises in **GLL** parsing
 *
 * All parsers of this type resolve their parsing in O(n^3) worse time to the input. They all return one or more valid parses
 * (ambiguous grammars have more than one valid parses) or an error.
 * If recursive grammars are parsed, only the largest parse possible will be returned (greedy approach).
 * **Spurious ambiguity** is pruned and all results with the same semantics are considered the same result.
 * **Essential ambiguity** on the other hand is fully supported and if 2 results have different semantics, they will
 * both be returned. This comes at a cost, as now the worst case rises to exponential O(2^k) complexity, where k all
 * different results with different semantics.
 *
 * **Spurious ambiguity**: A sentence is *spuriously ambiguous* if all its parse trees have the exact same semantics
 * **Essential ambiguity**: A sentence is *essentially ambiguous* if it has at least 2 parse trees with different semantics
 *
 * A constant parameter {@link MAX_AMBIGUITY_BREADTH} is employed to keep the breadth of possible tree production under control and
 * prevent stack overflows.
 *
 * **Localised Memoisation** is employed on the parser level to store intermediate results
 * for specific inputs and prevent recalculations and loops that might occur.
 * There exists an **automatic flush** policy on each parser where the memoisation tables will be
 * flushed each time the target of parsing changes, where it usually means that a new parsing is
 * requested and, thus, the old memoisation table entries are now irrelevant.
 * This is there to prevent heap allocation issues that might occur.
 *
 * @group Parsing
 */
export class SymbolParser<D extends Identifiable, E extends Identifiable> {

    /**
     * Restricts the maximum number of possible parse tree branches to the value specified.
     *
     * If it is defined as *Infinity*, then no restriction is applied.
     */
    static MAX_AMBIGUITY_BREADTH: number = Infinity;

    /**
     * The state transformer function that performs the parser logic.
     */
    public readonly transformer: ContinuationParseStateTransformer<D, E>;
    /**
     * A map from {@link ParseState} inputs to {@link ParseState} outputs produced by the parser, for those inputs
     * and {@link Continuation} functions to which those outputs are to be passed.
     *
     * Semantic values from input states are also used to distinguish different parsing paths to provide support for
     * **essential ambiguity**
     */
    private memotable: Map<string, {
        results: Map<string, ParseState<D, E>>,
        continuations: Continuation<D, E>[],
    }> = new Map();

    /**
     * The current target for the current execution.
     *
     * Each execution has a unique target that stays the same during execution.
     * When the target changes, we know that a new execution takes place and can
     * clear the memotable.
     */
    private currentTarget: string = '';

    constructor(
        transformer: ContinuationParseStateTransformer<D, E>,
    ) {
        const self = this;
        this.transformer = function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            if (state.target !== self.currentTarget) {
                self.memotable.clear();
                self.currentTarget = state.target;
            }
            if (self.memotable.get(state.identity) !== undefined) {
                self.memotable.get(state.identity)!.continuations.push(continuation);
                self.memotable.get(state.identity)!.results.forEach((result) => continuation(result));
            } else {
                if (self.memotable.get(state.identity)! === undefined) {
                    self.memotable.set(state.identity, {
                        results: new Map(),
                        continuations: [],
                    });
                }
                self.memotable.get(state.identity)!.continuations.push(continuation);
                // By filtering the result, no duplicate parsers will run and thus this implements the *done* set
                // The *popped* set is implemented automatically on memoisation, thus the GSS structure is complete
                // and the algorithm runs on O(n^3) time
                if (parseStack.filter((item: [ContinuationParseStateTransformer<D, E>, ParseState<D, E>, Continuation<D, E>]) => item[0] === transformer && item[1].identity === state.identity)) {
                    parseStack.push([
                        transformer,
                        state,
                        function (resultState: ParseState<D, E>): void {
                            // Limit (possibly infinite) ambiguity breadth
                            if (SymbolParser.MAX_AMBIGUITY_BREADTH !== Infinity &&
                                Array.from(self.memotable.get(state.identity)!.results).filter(
                                    (value) => value[1].index === value[1].target.length
                                ).length > SymbolParser.MAX_AMBIGUITY_BREADTH) {
                                throw new Error(`Maximum ambiguity breadth reached. Check for infinite ambiguity in the grammar produced by your parser.`);
                            }
                            if (self.memotable.get(state.identity)!.results.get(resultState.identity) === undefined) {
                                self.memotable.get(state.identity)!.results.set(resultState.identity, resultState);
                                self.memotable.get(state.identity)!.continuations.forEach((continuation) => continuation(resultState));
                            }
                        },
                    ]);
                }
            }
        }
    }

    /**
     * Defines a {@link SymbolParser} that will execute `parserThunk` to get a parser and execute it.
     *
     * It employs **localised memoisation** of the parser returned by `parserThunk` so that it does not have to
     * be redefined on every execution.
     *
     * It's purpose is to defer the execution of a {@link SymbolParser} constructor for later,
     * in cases where  it contains a reference to itself (i.e. for **recursion**)
     * It can be used to construct **recursive parsers** that would otherwise could not be possible to define due to
     * JavaScript's **eager evaluation**.
     *
     * @param parserThunk   - A function that returns a new {@link SymbolParser}.
     * @returns A new {@link SymbolParser} that will lazily execute `parserThunk`'s returned parser.
     */
    static lazy<D extends Identifiable, E extends Identifiable>(
        parserThunk: () => SymbolParser<D, E>,
    ): SymbolParser<D, E> {
        let memoisedParser: SymbolParser<D, E>;
        return new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            if (memoisedParser === undefined) {
                memoisedParser = parserThunk();
            }
            memoisedParser.transformer(state, continuation, parseStack);
        });
    }

    /**
     * Defines a {@link SymbolParser} that will execute a {@link TokenParser}, `parser`, for it's results.
     *
     * It basically *promotes* a {@link TokenParser} to a {@link SymbolParser} so that the former can be used in the
     * more advanced context of generalised grammars, when the capabilities of {@link TokenParser} are not sufficient.
     *
     * @param parser    - The {@link TokenParser} to be promoted.
     * @returns A new {@link SymbolParser} that will execute `parser`.
     */
    static toSymbol<D extends Identifiable, E extends Identifiable>(
        parser: TokenParser<D, E>,
    ): SymbolParser<D, E> {
        return new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            continuation(parser.transformer(state));
        });
    }

    /**
     * Runs the parser for the specified `target`, with optional `index` and
     * `data` semantic value.
     *
     * It returns a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)
     * which will lazily generate all possible parse results from the parser execution,
     * one by one.
     * If the parser parses an **infinitely ambiguous grammar**, the generator will always produce new results.
     *
     * @param target    - The complete input to be parsed.
     * @param [index]   - An optional initial index in the `target`. Defaults to **0**.
     * @param [data]    - An optional initial semantic value. Defaults to **null**
     * @returns A [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) which produces new {@link ParseState} results on each iteration.
     */
    *generate(
        target: string,
        data: D,
        index?: number,
    ): Generator<ParseState<D, E>, ParseState<D, E>[], undefined> {
        const results: ParseState<D, E>[] = [];
        let resultsCount = 0;
        const parseStack: ParseStack<D, E> = [];
        parseStack.push([
            this.transformer,
            new ParseResult<D>(target, index ?? 0, [], data),
            function (state: ParseState<D, E>): void {
                results.push(state);
            },
        ]);
        while (parseStack.length > 0) {
            while (parseStack.length > 0 && results.length <= resultsCount) {
                const [transformer, nextState, continuation] = parseStack.pop()!;
                transformer(nextState, continuation, parseStack);
            }
            while (results.length > resultsCount) {
                yield results[resultsCount];
                resultsCount++;
            }
        }
        return results;
    }

    /**
     * Runs the parser for the specified input `target`, with optional `index` and
     * `data` semantic value.
     *
     * Returns an array that contains all the {@link ParseState} results produced.
     *
     * @param target    - The complete input to be parsed.
     * @param [index]   - An optional initial index in the `target`. Defaults to **0**.
     * @param [data]    - An optional initial semantic value. Defaults to **null**
     * @returns An array containing all {@link ParseState} results or an error.
     */
    run(
        target: string,
        data: D,
        index?: number,
    ): ParseState<D, E>[] {
        const results: ParseState<D, E>[] = [];
        for (let result of this.generate(target, data, index)) {
            results.push(result);
        }
        results.sort((a: ParseState<D, E>, b: ParseState<D, E>) => a.index - b.index);
        const maxIndex = results[results.length - 1].index;
        const maxResults = results.filter((state: ParseState<D, E>) => state.index >= maxIndex)
        const nonErrorResults: ParseState<D, E>[] = maxResults.filter((state: ParseState<D, E>) => !state.isError);
        return (nonErrorResults.length > 0) ? nonErrorResults : maxResults;
    }

    /**
     * Runs the parser for the specified `target` and optional `index` and
     * `data` *asynchronously*
     *
     * Returns a promise that resolves to an array that contains all {@link ParseState} results produced.
     *
     * @param target    - The complete input to be parsed.
     * @param [index]   - An optional initial index in the `target`. Defaults to **0**.
     * @param [data]    - An optional initial semantic value. Defaults to **null**
     * @returns A promise which resolves to an array containing all {@link ParseState} results or an error.
     */
    async asyncRun(
        target: string,
        data: D,
        index?: number,
    ): Promise<ParseState<D, E>[]> {
        const results: ParseState<D, E>[] = [];
        for (let result of this.generate(target, data, index)) {
            results.push(await result.toPromise());
        }
        return results;
    }

}

/**
 * A unified type for the available parsers
 *
 * There exist the following **parsers** in **gparse**:
 * 1. A {@link TokenParser} with LL(k) parser capabilities
 * 2. A {@link SymbolParser} with GLL parser capabilities
 *
 * @group Parsing
 *
 * @internal
 */
export type Parser<D extends Identifiable, E extends Identifiable> = TokenParser<D, E> | SymbolParser<D, E>;

/**
 * Defines a {@link TokenParser} that will match a string `s`.
 *
 * If no match was made and targer reached EOF, an error with a semantic error value returned
 * by `matchError` gets returned.
 * If no match was made, an error with a semantic error value returned by `matchError`
 * gets returned.
 *
 * @param s             - The string to be matched.
 * @param EOFError      - A callback that returns a semantic error value for "Unexpected EOF".
 * @param matchError    - A callback that returns a semantic error value for "No match found".
 * @returns A new {@link TokenParser} that will match `s`.
 *
 * @group Parsers
 */
export function str<D extends Identifiable, E extends Identifiable>(
    s: string,
    EOFError: ParseErrorProduction<E>,
    matchError: ParseErrorProduction<E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }
        if (state.index >= state.target.length) {
            return updateParseError(state, EOFError(state.target, state.index));  // Placeholder: `str: Unexpected EOF.`
        }

        const target = state.target.slice(state.index);
        if (!target.startsWith(s)) {
            return updateParseError(state, matchError(state.target, state.index));  // Placeholder: `str: Tried to match '${s}', but got '${target}'.`
        }
        return updateParseResult(state, state.index + s.length, state.data, s);
    });
}

/**
 * Defines a {@link TokenParser} that will match a *regular expression* `regex`.
 *
 * If no match was made and targer reached EOF, an error with a semantic error value returned
 * by `matchError` gets returned.
 * If no match was made, an error with a semantic error value returned by `matchError`
 * gets returned.
 *
 * @param regex         - The regular expression to be matched.
 * @param EOFError      - A callback that returns a semantic error value for "Unexpected EOF".
 * @param matchError    - A callback that returns a semantic error value for "No match found".
 * @returns A new {@link TokenParser} that will match `regex`.
 *
 * @group Parsers
 */
export function regex<D extends Identifiable, E extends Identifiable>(
    regex: RegExp,
    EOFError: ParseErrorProduction<E>,
    matchError: ParseErrorProduction<E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }
        if (state.index >= state.target.length) {
            return updateParseError(state, EOFError(state.target, state.index));  // Placeholder: `regex: Unexpected EOF.`
        }

        const target = state.target.slice(state.index);
        const match = target.match(regex);
        if (!match) {
            return updateParseError(state, matchError(state.target, state.index));  // Placeholder: `regex: Tried to match regex '${regex.source}', but got ${target}`
        }
        return updateParseResult(state, state.index + match[0].length, state.data, match[0]);
    });
}

/**
 * Defines a {@link TokenParser} that will match `parser` as many times as possible in a row.
 *
 * @param parser    - The parser to be matched.
 * @returns A new {@link TokenParser} that will match `parser` as many times as possible.
 *
 * @group Parsers
 */
export function many<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }

        let nextState = state;
        while (true) {
            const output = parser.transformer(nextState);
            if (output.isError) {
                break;
            }
            nextState = output;
            if (nextState.index >= nextState.target.length) {
                break;
            }
        }

        return nextState;
    });
}

/**
 * Defines a {@link TokenParser} that will match `parser` as many times as possible in a row, but at least once.
 *
 * If `parser` does not get matched at least once, an error with a semantic
 * error value returned by `matchError` gets returned.
 *
 * @param parser        - The parser to be matched.
 * @param matchError    - A callback that returnes a semantic error value for "No match found".
 * @returns A new {@link TokenParser} that will match `parser` as many times as possible.
 *
 * @group Parsers
 */
export function many1<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
    matchError: ParseErrorProduction<E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }

        const nextState = many(parser).transformer(state);
        if (!nextState.isError && nextState.result.length === 0) {
            return updateParseError(state, matchError(state.target, state.index));  // Placeholder: `many1: Expected to match at least one value, but matched none.`
        }

        return nextState;
    });
}

/**
 * It defines a {@link TokenParser} that will match `parser` if it matches.
 * If `parser` does not match, it will not consume any input and stay in place.
 *
 * It works like the *question mark ( ? )* operator in regular expressions.
 *
 * The same behavior is implemented for {@link SymbolParser} in the following way:
 * ```typescript
 *  const optional_a: SymbolParser<null, null> = alternatives([
 *      recursive(str('a')),
 *      empty,
 *  ]);
 * ```
 *
 * @param parser    - The parser to be optionally matched.
 * @returns A new {@link TokenParser} that will optionally match `parser`.
 *
 * @group Parsers
 */
export function optional<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }

        let nextState = parser.transformer(state);
        return (nextState.isError) ? state : nextState;
    });
}

/**
 * It defines a {@link TokenParser} that will match anything until the given `terminator` parser matches.
 * The `terminator` parser will not be consumed and index will stay just behind it so that it can be parsed right ahead.
 * That is, if `terminator` is chained to {@link until} it will always succeed.
 *
 * If `target` reaches EOF before matching, an error with a semantic error value returned by
 * `EOFError` gets returned.
 *
 * @param terminator    - The parser until which everything gets matched.
 * @param EOFError      - A callback that returns a semantic error value for "Unexpected EOF".
 * @returns A new {@link TokenParser} that matched everything until `terminator`.
 *
 * @group Parsers
 */
export function until<D extends Identifiable, E extends Identifiable>(
    terminator: TokenParser<D, E>,
    EOFError: ParseErrorProduction<E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }

        let nextState = state;
        const start: number = nextState.index;
        while (true) {
            const output = terminator.transformer(nextState);
            if (!output.isError) {
                break;
            }
            if (nextState.index >= nextState.target.length) {
                return updateParseError(nextState, EOFError(nextState.target, nextState.index));  // Placeholder: `until: Unexpected EOF before matching terminator parser.`
            }
            nextState = updateParseResult(nextState, nextState.index + 1, nextState.data);
        }
        const result: string = nextState.target.substring(start, nextState.index);

        return updateParseResult(nextState, nextState.index, nextState.data, result);
    });
}

/**
 * Defines a {@link TokenParser} that will match the first parser from `parsers` that can be matched.
 * It employs **backtracking** by defining the current point as a *backtrackable state* and trying to parse
 * from this point onwards.
 * If a parser from `parsers` succeeds, it continues from that point onwards.
 * If no one of `parsers` matches, an error with a semantic error value returned by
 * `matchError` gets returned.
 *
 * It can be used to add **backtracking** to a parser.
 *
 * It is the equivalent to {@link alternatives} for {@link SymbolParser}.
 * It works like the *pipe ( | )* operator from regexes
 *
 * @param parsers       - The parsers to be matched.
 * @param matchError    - A callback that returns a semantic error value for "No match found".
 * @returns A new {@link TokenParser} that will match the first one from `parsers` that can match.
 *
 * @see {@link alternatives}
 *
 * @group Parsers
 */
export function choice<D extends Identifiable, E extends Identifiable>(
    parsers: [TokenParser<D, E>, ...TokenParser<D, E>[]],
    matchError: ParseErrorProduction<E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }

        for (let parser of parsers) {
            const output = parser.transformer(state);
            if (!output.isError) {
                return output;
            }
        }

        return updateParseError(state, matchError(state.target, state.index));  // Placeholder: `choice: Unable to match '${state.target.slice(state.index)}' to any of the given parsers.`
    });
}

/**
 * Defines a {@link TokenParser} that will execute `parser` to check for lookahead content,
 * and let `f` decide what to consume
 *
 * It can be used as lookahead for definitions of **LL(k)** parsers with only {@link TokenParser} parsers
 * (where no recursion is really needed).
 *
 * @param parser    - The parser that will look ahead.
 * @param f         - A callback that will accept results from `parser` to decide which {@link Parser} to return for execution.
 * @returns A new {@link TokenParser} that will execute the given `parser` to see if it succeeds, but without consuming the input.
 *
 * @group Parsers
 */
export function lookahead<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
    f: (state: ParseState<D, E>) => TokenParser<D, E>,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }
        return f(parser.transformer(state)).transformer(state);
    });
}

/**
 * Defines a new {@link TokenParser} that will execute `sideEffect` with the {@link ParseState} passed
 * to it and then return it.
 *
 * `sideEffect` is only executed and does not return anything. It is only executed for it's **side-effects**.
 *
 * Any side-effects executed may impose *performance penalties* to the parsing process, thus this functionality
 * must be used with great care and only in non-critical paths.
 *
 * It can be used for *logging* support.
 *
 * @param sideEffect    - A callback that will be called to produce side effects based on the {@link ParseState} passed.
 * @returns A new {@link TokenParser} that will execute `sideEffect` and not change the result.
 *
 * @group Parsers
 */
export function sideEffect<D extends Identifiable, E extends Identifiable>(
    sideEffect: (state: ParseState<D, E>) => void,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        sideEffect(state);
        return state;
    });
}

/**
 * Defines a {@link TokenParser} that, in case of a valid result passed to it, will fail with the
 * provided `error` semantic value.
 *
 * If it is passed a {@link ParseError}, it will propagate it onwards with no change.
 * If it is passed a {@link ParseResult}, it will return the provided `error` {@link ParseError} and
 * parsing will stop at that point.
 *
 * It enables **error rules** to be defined, that will define a part of the grammar that should always
 * fail when detected.
 *
 * @param error - An error semantic value to be returned in case of a valid result.
 * @returns A new {@link TokenParser} whose execution will fail with an error or `error` in case a valid result is passed to it.
 *
 * @group Parsers
 */
export function error<D extends Identifiable, E extends Identifiable>(
    error: E,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (state.isError) {
            return state;
        }
        return updateParseError(state, error);
    });
}

/**
 * Defines a {@link TokenParser} that, in case of an error passed to it, will succeed with the
 * provided `data` semantic value.
 *
 * If it is passed a {@link ParseResult}, it will propagate it onwards with no change.
 * If it is passed a {@link ParseError}, it will return the provided `data` semantic value and
 * parsing will continue from that point onwards.
 *
 * It enables **error recovery** capabilities and defines a **synchronisation point** at the position where it gets
 * placed.
 *
 * @param data - A semantic value to be returned in case of an error result.
 * @returns A new {@link TokenParser} whose execution will succeed with a valid result or `data` in case of an error passed to it.
 *
 * @see {@link error}
 *
 * @group Parsers
 */
export function recovery<D extends Identifiable, E extends Identifiable>(
    data: D,
): TokenParser<D, E> {
    return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
        if (!state.isError) {
            return state;
        }
        return updateParseResult(state, state.index, data);
    });
}

/**
 * Defines a {@link TokenParser} or {@link SymbolParser} that will execute `parser` and pass it's result to `assertion`.
 *
 * - If `parser` returns with an error, the error is propagated without executing the `assertion`
 * - If `assertion` evaluates to some {@link Identifiable} object, that object will be returned as the error of the assertion.
 * - If `assertion` evaluates to ```null```, then the assertion is considered successful and the result of `parser` is propagated.
 *
 * It can be used to attach assertion operations in a `parser` result and determine if a token satisfies
 * specific criteria at that lexical scope.
 *
 * @param parser    - The parser to which `assertion`s are attached.
 * @param assertion - The function which will either return a new error if the assertion is falsy, or ```null``` if the assertion is truthy.
 * @returns A new {@link TokenParser} or {@link SymbolParser} that will execute `parser` and attach assertion operations defined by `assertion`.
 */
export function assert<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
    assertion: (state: ParseState<D, E>) => E | null,
): TokenParser<D, E>;
export function assert<D extends Identifiable, E extends Identifiable>(
    parser: SymbolParser<D, E>,
    assertion: (state: ParseState<D, E>) => E | null,
): SymbolParser<D, E>;
export function assert<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E> | SymbolParser<D, E>,
    assertion: (state: ParseState<D, E>) => E | null,
): TokenParser<D, E> | SymbolParser<D, E> {
    if (parser instanceof TokenParser<D, E>) {
        return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
            if (state.isError) {
                return state;
            }

            const nextState = parser.transformer(state);
            if (nextState.isError) {
                return nextState;
            }

            const assertionResult = assertion(nextState);
            if (assertionResult !== null) {
                return updateParseError(nextState, assertionResult);
            } else {
                return nextState;
            }
        });
    } else {
        return new SymbolParser(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            if (state.isError) {
                continuation(state);
            } else {
                parser.transformer(state, function (state: ParseState<D, E>): void {
                    if (state.isError) {
                        continuation(state);
                    } else {
                        const assertionResult = assertion(state);
                        if (assertionResult !== null) {
                            continuation(updateParseError(state, assertionResult));
                        } else {
                            continuation(state);
                        }
                    }
                }, parseStack);
            }
        });
    }
}

/**
 * Maps semantic data from `parser` to new user-defined ones. It maps
 * - {@link ParseResult.data} if `parser` returns a {@link ParseResult}
 * - {@link ParseError.error} if `parser` returns a {@link ParseError}
 *
 * It is used to define new interfaces for {@link ParseState} results from parsers.
 * This is the main way to customise semantic data and even alter the
 *
 * @param parser    - The parser whose result will be altered.
 * @param mdata     - A callback that accepts a {@link ParseState} from `parser` to decide how to map {@link ParseResult.data}.
 * @param merror    - A callback that accepts a {@link ParseState} from `parser` to decide how to map {@link ParseError.error}.
 * @returns A new {@link TokenParser} or {@link SymbolParser} of the same type, whose execution will return the altered results.
 *
 * @group Parsers
 */
export function map<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E>,
    mdata: (state: ParseResult<D>) => D,
    merror: (state: ParseError<E>) => E,
): TokenParser<D, E>;
export function map<D extends Identifiable, E extends Identifiable>(
    parser: SymbolParser<D, E>,
    mdata: (state: ParseResult<D>) => D,
    merror: (state: ParseError<E>) => E,
): SymbolParser<D, E>;
export function map<D extends Identifiable, E extends Identifiable>(
    parser: TokenParser<D, E> | SymbolParser<D, E>,
    mdata: (state: ParseResult<D>) => D,
    merror: (state: ParseError<E>) => E,
): TokenParser<D, E> | SymbolParser<D, E> {
    if (parser instanceof TokenParser<D, E>) {
        return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
            const nextState = parser.transformer(state);
            if (nextState.isError) {
                return updateParseError(nextState, merror(nextState));
            } else {
                return updateParseResult(nextState, nextState.index, mdata(nextState));
            }
        });
    } else {
        return new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            parser.transformer(state, function (nextState: ParseState<D, E>): void {
                if (nextState.isError) {
                    continuation(updateParseError(nextState, merror(nextState)));
                } else {
                    continuation(updateParseResult(nextState, nextState.index, mdata(nextState)));
                }
            }, parseStack);
        });
    }
}

/**
 * Generates a new {@link TokenParser} or {@link SymbolParser} that will chain `parsers` together one after the other unconditionally
 * in the order specified.
 * It will optionally execute some `action` on semantic data values returned by `parsers`
 * and return the semantic value returned by `action`.
 * At least one parser must be passed.
 * If at least one of the `parsers` fail, the {@link ParseError} will be returned and `action`
 * will not be executed.
 * If the {@link ParseError} needs to be handled, the {@link chain} parser can always be nested
 * in a {@link map} parser.
 *
 * It can be used where there are multiple chains to be done at once, (ex: at grammar rules).
 * It is actually a simple *fold* operation on the {@link chain} parser with an optional `action`
 * on the end of them.
 *
 * It is suggested in cases where {@link chain} nesting is used:
 * ```typescript
 *  const a: TokenParser<any, any> = str('a');
 *  const b: TokenParser<any, any> = str('b');
 *  const ab: TokenParser<any, any> = chain(a, (_) => b);
 *  const better_ab: TokenParser<any, any> = chain([a, b]);
 * ```
 *
 * The `action` is made to simulate **Bison's "actions"** and can be used to define an
 * **Abstract Syntax Tree (AST)** for the input by changing the semantic data.
 *
 * @param parsers - The parsers to be chained
 * @param action    - A callback that accepts all semantic values from `parsers` executions and returns a new semantic value.
 * @returns A new {@link TokenParser} or {@link SymbolParser} that will chain `parsers` and execute them along with an optional `action` at the end of the chain.
 *
 * @see {@link chain}
 * @see {@link map}
 *
 * @group Parsers
 */
export function chain<D extends Identifiable, E extends Identifiable>(
    parsers: [TokenParser<D, E>, ...TokenParser<D, E>[]],
    action?: (data: D[]) => D,
): TokenParser<D, E>;
export function chain<D extends Identifiable, E extends Identifiable>(
    parsers: [SymbolParser<D, E>, ...SymbolParser<D, E>[]],
    action?: (data: D[]) => D,
): SymbolParser<D, E>;
export function chain<D extends Identifiable, E extends Identifiable>(
    parsers: [TokenParser<D, E> | SymbolParser<D, E>, ...(TokenParser<D, E> | SymbolParser<D, E>)[]],
    action?: (data: D[]) => D,
): TokenParser<D, E> | SymbolParser<D, E> {
    if (parsers[0] instanceof TokenParser<D, E>) {
        return new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
            const backrefs: Map<string, ParseResult<D>> = new Map();  // Backreferences map of results -> inputs that produced them
            // JS closures capture variable references rather than values, thus this push/pop abstraction is employed to generate new values for each step
            const chains: TokenParser<D, E>[] = [];
            if (action !== undefined) {
                chains.push(new TokenParser<D, E>(function (state: ParseState<D, E>): ParseState<D, E> {
                    if (state.isError) {
                        return state;
                    } else {
                        const data: D[] = new Array<D>(parsers.length);
                        let searchState: ParseResult<D> = state;
                        for (let i = parsers.length - 1; i >= 0; i--) {
                            data[i] = searchState!.data;
                            searchState = backrefs.get(searchState.identity)!;
                        }
                        return updateParseResult(state, state.index, action(data));
                    }
                }));
            } else {
                chains.push(parsers[parsers.length - 1] as TokenParser<D, E>);
            }
            for (let i = parsers.length - ((action === undefined) ? 2 : 1); i >= 0; i--) {
                const nextChain = chains.pop()!;
                chains.push(new TokenParser(function (state: ParseState<D, E>): ParseState<D, E> {
                    const nextState = (parsers[i] as TokenParser<D, E>).transformer(state);
                    if (action !== undefined && !nextState.isError) {
                        backrefs.set(nextState.identity, state as ParseResult<D>);
                    }
                    return nextChain.transformer(nextState);
                }));
            }
            return chains.pop()!.transformer(state);
        });
    } else {
        return new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
            const backrefs: Map<string, ParseResult<D>> = new Map();  // Backreferences map of results -> inputs that produced them
            // JS closures capture variable references rather than values, thus this push/pop abstraction is employed to generate new values for each step
            const chains: SymbolParser<D, E>[] = [];
            if (action !== undefined) {
                chains.push(new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
                    if (state.isError) {
                        continuation(state);
                    } else {
                        const data: D[] = new Array<D>(parsers.length);
                        let searchState: ParseResult<D> = state;
                        for (let i = parsers.length - 1; i >= 0; i--) {
                            data[i] = searchState!.data;
                            searchState = backrefs.get(searchState.identity)!;
                        }
                        continuation(updateParseResult(state, state.index, action(data)));
                    }
                }));
            } else {
                chains.push(parsers[parsers.length - 1] as SymbolParser<D, E>);
            }
            for (let i = parsers.length - ((action === undefined) ? 2 : 1); i >= 0; i--) {
                let nextChain = chains.pop()!;
                chains.push(new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
                    (parsers[i] as SymbolParser<D, E>).transformer(state, function (nextState: ParseState<D, E>): void {
                        if (action !== undefined && !nextState.isError) {
                            backrefs.set(nextState.identity, state as ParseResult<D>);
                        }
                        nextChain.transformer(nextState, continuation, parseStack)
                    }, parseStack);
                }));
            }
            chains.pop()!.transformer(state, continuation, parseStack);
        });
    }
}

/**
 * Defines a {@link TokenParser} or {@link SymbolParser} that will {@link chain} parsers yielded by `generator`.
 * Each {@link TokenParser} or {@link SymbolParser} yielded by `generator` will be chained to the previous one.
 * An `initial` parser needs to be provided as the first one in the chain.
 *
 * It can be used to construct *parse chains* in an imperative way, applying {@link chain} to any yielded
 * parsers. It's purpose is for convenience of writing parsers.
 *
 * @param initial   - The first parser in the chain to be executed.
 * @param generator - A generator function that will yield a {@link TokenParser} or {@link SymbolParser} chain and return a resulting {@link ParseState}.
 * @returns A new {@link TokenParser} or {@link SymbolParser} that will execute the chain defined by `generator`'s yields with `initial` as it's initial parser.
 *
 * @see {@link chain}
 *
 * @group Parsers
 */
export function contextual<D extends Identifiable, E extends Identifiable>(
    initial: TokenParser<D, E>,
    generator: () => Generator<TokenParser<D, E>, void, void>,
): TokenParser<D, E>;
export function contextual<D extends Identifiable, E extends Identifiable>(
    initial: SymbolParser<D, E>,
    generator: () => Generator<SymbolParser<D, E>, void, void>,
): SymbolParser<D, E>;
export function contextual<D extends Identifiable, E extends Identifiable>(
    initial: TokenParser<D, E> | SymbolParser<D, E>,
    generator: () => Generator<TokenParser<D, E> | SymbolParser<D, E>, void, void>,
): TokenParser<D, E> | SymbolParser<D, E> {
    const parsers: [TokenParser<D, E> | SymbolParser<D, E>, ...(TokenParser<D, E> | SymbolParser<D, E>)[]] = [initial];
    for (let result of generator()) {
        parsers.push(result);
    }

    if (initial instanceof TokenParser<D, E>) {
        return chain(parsers as [TokenParser<D, E>, ...TokenParser<D, E>[]]);
    } else {
        return chain(parsers as [SymbolParser<D, E>, ...SymbolParser<D, E>[]]);
    }
};

/**
 * Defines a {@link SymbolParser} that will check all alternative `parsers` for a match.
 *
 * It works by adding all `parsers` in the {@link ParseStack} passed to it for deferred evaluation.
 * It tests all `parsers` for results and whichever matches appends a new result to the returned list.
 * If no parser matches, the first error to be produced gets returned.
 *
 * It is the equivalent to {@link choice} for {@link TokenParser}.
 * It works like the *pipe ( | )* operator in BNF notation and can define different rules for the same symbol.
 *
 * @param parsers   - The parsers to be matched.
 * @returns A new {@link TokenParser} that will push all `parsers` for later evaluation.
 *
 * @see {@link choice}
 *
 * @group Parsers
 */
export function alternatives<D extends Identifiable, E extends Identifiable>(
    parsers: [SymbolParser<D, E>, ...SymbolParser<D, E>[]],
): SymbolParser<D, E> {
    return new SymbolParser<D, E>(function (state: ParseState<D, E>, continuation: Continuation<D, E>, parseStack: ParseStack<D, E>): void {
        if (state.isError) {
            continuation(state);
        } else {
            for (let parser of parsers) {
                parser.transformer(state, continuation, parseStack);
            }
        }
    });
}

/**
 * A {@link SymbolParser} that will succeed and not match anything.
 *
 * It can be used to construct *optional* symbols or resolve ambiguities.
 */
export const empty: SymbolParser<any, any> = new SymbolParser<any, any>(function (state: ParseState<any, any>, continuation: Continuation<any, any>, parseStack: ParseStack<any, any>): void {
    continuation(state);
});