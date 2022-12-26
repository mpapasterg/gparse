# gparse

The **gparse** parser combinator library consists of:

1. A set of **token** parsers that implement the *recursive descent parsing technique*. They can be thought of as *tokens* in a grammar and they enable the creation of any parser that can:
   - employ *backtracking* on the paths it takes.
   - check for an arbitrary amount of *lookahead*.
This model of parsing is capable of parsing token-like structures in a grammar but cannot handle neither *recursion* nor *ambiguity*. The parsers are applied *eagerly* and the first parse tree found will be followed to it's end. In other words, a DFS (Depth-First Search) approach is taken when producing parse trees.

1. A set of **symbol** parsers that implement the *GLL (Generalised LL) parsing technique*. They can too be thought as *symbols* in a grammar and enable the creation of any parser of a *CFG* grammar.
They are built on top of **token** parsers and can account for arbitrary amounts of *recursion* and *ambiguity* in a grammar in polynomial time complexity. In order to achieve this, a hybrid search approach is taken where the entire search space for parse trees is explored but in a DFS manner (using a *stack*) in order to improve the chances of getting the first solutions early (in case not all solutions are required).

The **symbol** parsers do achieve the same time complexities as **token** when it comes to the grammars that both can handle, but they do make use of more complex mechanisms that are necessary for the *GLL* algorithm internals and thus contribute a greater constant factor than that of the **token** parsers.

Thus, it is strongly suggested to use the **token** parsers whenever possible and use **symbol** parsers only when necessary.

To help with this, when someone during developement finds out that **token** parsers won't cut it, they can *convert* a **token** parser to a **symbol** one using the {@link SymbolParser.toSymbol} static method.

In order to achieve the creation of parse trees that do represent valid and meaningful *semantics* and to make *ambiguity* in a parse tree possible, full support for **semantic data** and **errors** is provided. This makes **gparse** a great choice for cases where a **parse tree** is produced and *recognition* of the language of the grammar in question is not enough.
The semantics defined can be:

1. **Semantic data** for a specific parse tree *result* node
   These semantics can be provided:
   - At the beginning of a parsing, an *initial semantic value* can be provided that will then be propagated to the next parse results.
   - At each parser using a {@link map} parser or by providing an *action* in a {@link chain} parser.
2. **Semantic errors** for a specific parse tree *error*
   These semantics are defined in the following cases:
   - At each parser that is capable of producing a parse error, there are required arguments to it that force the user to define some expected semantic error to be returned in case the error occurs while parsing.
   - At each parser using a {@link map} parser, an error can be overriden for more specialised control over the error production.
   - Using the {@link error} parser, a parser that always fails with the specified error can be defined.
   Every time an error has occured, the parsing procedure can *recover* from an error in points where a {@link recovery} parser is used. This parser enables the definition of *error recovery* in the parsing process.

In this library, only the very primitive parser combinators are implemented for each of those sets, as any parser can then be generated with the combination of those parsers.
The most primitive parsers required for a parser combinator library to be complete are:

- A parser that returns a successful *result*, that is a parser that matches with some input.
  In **gparse** this is implemented by {@link str} and {@link regex} parsers that will match given the correct input targets.
- A parser that returns some *error* and won't match it's input.
  This is implemented in **gparse** with:
  - Error productions wherever a parse error can occur (ex: when a {@link str} parser cannot match it's input)
  - The {@link error} parser that will always produce a specific error.
- A parser that performs *chaining* of parsers, so that the result of a parser execution can be *chained* to some next parser in the chain.
  *Chaining* in **gparse** is implemented using the {@link chain} parser where *multiple* parsers are chained in a sequence and where there might possibly exist an *action* to be executed when all of them have matched.
- A parser that executes many different *alternative* parsers at a specified point and matches the parser(s) that do match at that point onwards.
  *Alternatives* in **gparse** are implemented using:
  - The {@link choice} parser for **token** parsers where the alternatives are applied one after the other in a *backtracking* fashion (the first that matches produces the result of the parser but all are executed from the same point).
  - The {@link alternatives} parser for **symbol** parsers where the alternatives are applied one after the other but their execution paths are pushed on a parse stack for later evaluation on demand.

Also, the {@link map} parser is quite necessary in cases where handling of semantic values is required
as well as some form of *action* execution (provided with {@link chain} in **gparse**) in cases where the parse tree needs to be interpreted as it is being created.

In cases *recursion* is needed, a parser needs to be defined with the {@link SymbolParser.lazy} constructor that prevent JS's *eager evaluation* and allows a variable to be defined in terms of itself.

The list of primitive parsers is extended with the following (not so primitive) parsers that do in fact provide some useful behavior that someone might need for more convenient parser writing:

- The {@link many} parser is used as the *"Kleine-star (\*)"* operator from regular expressions for "zero or more" matches of the specified **token** parser.
- The {@link many1} parser is used as the *"+"* operator from regular expressions for "one or more" matches of the specified **token** parser.
- The {@link optional} parser is used as the *"?"* operator from regular expressions for "zero or one" matches of the specified **token** parser.
- The {@link until} parser is used to match anything behind a terminator parser and stop matching at the index where the terminator would match.
- The {@link decide} parser is used to select the next parser to be matched based on the last parse result in some chain.
- The {@link lookahead} parser is used to select the next parser to be matched based on some lookahead parser. The lookahead parser is executed at the current point and it's result is used to determine which parser to apply next.
- The {@link sideEffect} parser is used to execute some function wherever that parser is defined.
- The {@link recovery} parser is used to *recover* from an error at the point that parser is defined, with a new semantic value. It can be paired with {@link error} to provide *error recovery* capabilities.
- The {@link contextual} parser is used to define a *chain* of parsers in an *imperative* way. It is passed a user-defined *generator* where the next parser in the chain gets *yielded* at some specified point in the generator execution. The return value of the *yield* statements return the result or error that was produced by executing the yielded parser at that point.
- The {@link empty} **symbol** parser is used to define an *empty symbol*, used in specific grammars. It shall be used with caution as it might lead to implicitly *ambiguous* grammars.

Because some of the above operations are primitive enough to be done by **token** parsers and do not exhibit any special change in behavior when converted to a **symbol** parser, they are defined to work only with **token** parsers. When someone needs their functionality as a primitive in the **symbol** parser context, they can work with **token** parsers at the primitive level to create a fairly complex **token** parser and then convert to a **symbol** parser using the {@link SymbolParser.toSymbol} static method.

The definition of only those simple parsers sometimes make life a bit harder and the code more verbose but it allows for a more minimal, controllable and maintainable API that provides stable building blocks for any complex parser.
A *cookbook* or some *extension package* might enrich the library with many commonly user parser combinators in the future.

The **time complexity** guarrantees for any parser generated with either a **token** or a **symbol** parser is documented below:

|     Parser      | Regular Grammar | Grammar with *k* Lookahead | Grammar with *k* Backtracking | Grammar with Recursion | Grammar with Ambiguity |
| :-------------: | :-------------: | :------------------------: | :---------------------------: | :-------------------------: | :--------------------: |
| TokenParser |      O(n)       |            O(n)            |             O(n)              |              -              |           -            |
|  SymbolParser   |      O(n)       |            O(n)            |             O(n)              |            O(n)             |         O(n^3)         |

As for **space complexity**, all the above cases have **O(n)** linear space complexity.

Those guarrantees derive from the parsing algorithms used in the parser implementations. Practical tests have indeed proven correlation between the theoretical results of the parsing algorithms and the times of the **token** and **symbol** parsers.

An example usage of the **gparse** library can be found in the [README.md](https://github.com/mpapasterg/gparse) on the library's github. More examples are in the makings as well as a complete *Cookbook* for the most basic scenarios, as mentioned above.
