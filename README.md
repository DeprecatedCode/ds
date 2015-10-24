# ds
Default Script

## Syntax

### Blocks

`{ ... }` represents deferred.

`( ... )` represents grouping.

`[ ... ]` represents order.

`' ... '` represents string.

### Symbols

All words represent symbol names.

### Operations

`#` represents comment.

`+, -, *, /` represents arithmetic.

`,` represents separation.

`^` represents terminal raise.

`=` represents receive raised event.

`?` represents condition.

`@` represents named injection.

`<, <=, ==, !=, >=, >` represents comparison.

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

```js
ValidateName: {
  @name @type != 'string' ? 'Name must be a string' @TypeError ^
  @name @length < 5       ? 'Name must be at least 5 characters long' @ValueError ^
}

= @TypeError {
  @it.message @system.print
}

= @ValueError {
  `There was an error with the name: ${@it.message}` @system.print
}

{name: 'Bob'} ValidateName

'Success, the name is ok' @system.print

# There was an error with the name: Name must be at least 5 characters long
```

```js
Person: {
  name: @it
  
  description get: {`Person: ${@name}`}
}

Person Employee: {
  @name @super
  
  raiseSalary {
    @salary: @salary + @it
  }
  
  description get: {`Employee: ${@name} making ${@salary} per year`}
}

Person sarah: 'Sarah'

Employee bob: {salary: 40000, name: 'Bob'}
bob.salary: 50000
10000 bob.raiseSalary

sarah.description @system.print
bob.description @system.print

# Person: Sarah
# Employee: Bob making 50000 per year
```
