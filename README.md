# ds
Default Script

## Syntax

### Blocks

`{ ... }` represents deferred.

`( ... )` represents grouping.

`[ ... ]` represents order.

`' ... '` represents string.

### Symbols

All words represent Symbols.

### Operations

`#` represents comment.

`+, -, *, /` represents arithmetic.

`,` represents separation.

`?` represents condition.

`@` represents named injection.

`<, <=, ==, >=, >` represents comparison.

`and, or, xor, not, nand, nor, xnor` represents boolean logic.

### Examples

```js
'Hello World' @system.print

# Hello World
```

```js
Hello: {
  ['Hello', @what].each {
    @it @system.print
  }
}

{what: 'World'} Hello

# Hello
# World

what: 'Planet', Hello

# Hello
# Planet
```

```js
Adder: {@a + @b}

AddFour: {a: 4, Adder}

{b: 6} AddFour @system.print

# 10
```
