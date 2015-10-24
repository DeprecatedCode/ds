# ds
Default Script

## Syntax

### Blocks

`{ ... }` represents deferred.

`( ... )` represents grouping.

`[ ... ]` represents order.

`' ... '` represents string.

### Deferred Execution

A deferred block is executed by placing another deferred block next to it. These share scope as if they were the same object. For example:

```js
{name: 'Jacob'} {name @system.print}

# Jacob
```

The second deferred block can modify properties of the first, as they are always combined. For example:

```js
person: {
  firstName: 'Lady',
  lastName: 'MacBeth'
  
  print get: {
    `${firstName} ${lastName}` @system.print
  }
}

person {firstName: 'Violet'}

person.print

# Violet MacBeth
```

### Symbols

All words represent symbol names.

### Operations

`#` represents comment.

`.` represents property.

`:` represents assignment.

`+, -, *, /` represents arithmetic.

`,` represents separation.

`^` represents terminal raise.

`=` represents receive raised event.

`??` represents true condition.

`?!` represents false condition.

`@` represents named injection.

`<, <=, ==, !=, >=, >` represents comparison.

`&&, !!, ||, <>, ><, ~~, !` represents boolean logic (AND, NAND, OR, NOR, XOR, NXOR, NOT).

### Boolean Logic Truth Table

| A | B | Syntax | Result | Syntax | Result |
|---|---|--------|--------|--------|--------|
|   |   | *and*  |        | *nand* |        |
| F | F | A && B | F      | A !! B | T      |
| F | T | A && B | F      | A !! B | T      |
| T | F | A && B | F      | A !! B | T      |
| T | T | A && B | T      | A !! B | F      |
|   |   | *or*   |        | *nor*  |        |
| F | F | A || B | F      | A <> B | T      |
| F | T | A || B | T      | A <> B | F      |
| T | F | A || B | T      | A <> B | F      |
| T | T | A || B | T      | A <> B | F      |
|   |   | *xor*    |      | *nxor* |        |
| F | F | A >< B | F      | A ~~ B | T      |
| F | T | A >< B | T      | A ~~ B | F      |
| T | F | A >< B | T      | A ~~ B | F      |
| T | T | A >< B | F      | A ~~ B | T      |
|   |   |*(none)*|        | *not*  |        |
| F |   | A      | F      | !A     | T      |
| T |   | A      | T      | !A     | F      |

### Examples

```js
'Hello World' @system.print

# Hello World
```

```js
Hello: {
  ['Hello', what].each {
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
Adder: {a + b}

AddFour: {a: 4, Adder}

{b: 6} AddFour @system.print

# 10
```

```js
ValidateName: {
  name @String.isInstanceOf ?! 'Name must be a string' @TypeError ^
  name @length < 5          ?? 'Name must be at least 5 characters long' @ValueError ^
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
  title: 'Person'
  
  description get: {`${title}: ${name}`}
}

Person Employee: {
  name @super
  title: 'Employee'
  
  raiseSalary {
    salary: salary + @it
  }
  
  description get: {`${@super} making ${salary} per year`}
}

sarah: 'Sarah' Person

bob: {salary: 40000, name: 'Bob'} Employee
bob.salary: 50000
15000 bob.raiseSalary

sarah.description @system.print
bob.description @system.print

# Person: Sarah
# Employee: Bob making 65000 per year
```
