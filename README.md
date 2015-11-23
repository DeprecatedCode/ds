# ds
Default Script

## Quickstart

Clone this repo, then run `node . examples/index.ds` from this folder. Paths are resolved relatively and absolutely as desired. It is also possible to use `node ds .` from a project where you have installed ds as a node module.

## Syntax

### Comments

`# comment` is a line comment.

### Blocks

`{ ... }` represents deferred logic.

`( ... )` represents grouped logic.

`[ ... ]` represents an array.

`' ... '` represents a string.

### Names

All plain words `[$@_a-zA-Z0-9]+` represent symbol names.

There are 4 reserved names: `true`, `false`, `nil`, and `undef`.
These values cannot be overridden in a scope.

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
