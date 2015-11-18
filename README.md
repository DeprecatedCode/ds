# ds
Default Script

## Quickstart

Clone this repo, then run `node . index.ds` from this folder. Paths are resolved relatively and absolutely as desired. It is also possible to use `node ds .` from a project where you have installed ds as a node module.

## Syntax

### Blocks

`{ ... }` represents deferred logic.

`( ... )` represents grouping.

`[ ... ]` represents an array.

`' ... '` represents a string.

### Symbols

All words represent symbol names.

### Operators

`\` is the escape character.

`#` is a line comment.

`.` represents property access.

`key: value` represents key: value assignment.

`:key` represents convenience (key: key) assignment.

`+` represents merge functions.

`+, -, *, /, %` represents arithmetic.

`,` represents a break.

`^` represents terminal raise. `@TODO`

`|` represents receive raised event. `@TODO`

`@` represents named injection.

`<, <=, =, !=, >=, >` represents comparison. `@TODO`

`&&, !!, ||, <>, ><, ~~, !` represents boolean logic (AND, NAND, OR, NOR, XOR, NXOR, NOT). `@TODO`
