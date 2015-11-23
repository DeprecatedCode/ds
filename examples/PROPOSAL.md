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

`#` represents comment. `@TODO`

`.` represents property.

`:` represents key: value assignment.

`::` represents convenience (key: key) assignment. `@TODO`

`+, -, *, /, %` represents arithmetic.

`,` represents separation.

`^` represents terminal raise. `@TODO`

`=` represents receive raised event. `@TODO`

`@` represents named injection.

`<, <=, ==, !=, >=, >` represents comparison. `@TODO`

`&&, !!, ||, <>, ><, ~~, !` represents boolean logic (AND, NAND, OR, NOR, XOR, NXOR, NOT). `@TODO`

## Scope Rules

##### 1. The entire file starts out as a blank scope. Any properties defined are created in that scope. For example:

```bash
a: 1

a @console.log

# 1
```

##### 2. Any logic blocks share the scope in which they are invoked. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

@ x

a @console.log
x.a @console.log

# 1
# undefined
```

##### 3. Any logic block pairs applied to each other are automatically isolated from the current scope. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

y: {} x    # Read: create a new scope since we are not invoking based on the parent

[a, x.a, y.a].each @console.log

# undefined
# undefined
# 1
```

##### 4. Logic blocks are not invoked until used. For example:

```bash
x: {a: 1, 2 @console.log}

({} x).a @console.log

# 2
# 1
```

##### 5. Scopes can be continually updated by applying additional logic blocks. For example:

```bash
x: {a: 1}
y: {b: 2}
z: {c: 3}

q: x y  # Read: create scope q based on x and y
q z     # Read: execute z in the context of q, modifying q
@ z     # Read: execute z in the current context, modifying it

[q.a, q.b, q.c, a, b, c].each @console.log

# 1
# 2
# 3
# undefined
# undefined
# 3
```

##### 6. Any scope created within another scope has first-level access to the properties created in the parent. But it will not create properties in the parent, because it is isolated. For example:

```bash
a: 1
x: {} {a::, b: b, c: 3}

[x.a, x.b, x.c] @console.log
[a, b, c] @console.log

# 1
# undefined
# 3
# 1
# undefined
# undefined
```

##### 7. The new scope will be returned by the operation of two logic blocks and can be continually chained. For example:

```bash
{name: 'Jacob'} {name @console.log} {name: `Superhero ${name}`} {name @console.log}

# Jacob
# Superhero Jacob
```

##### 8. The logic blocks themselves will not be changed upon invocation. For example:

```bash
Person: {
  firstName: 'Lady'
  lastName: 'MacBeth'

  print get: {
    `${firstName} ${lastName}` @console.log
  }
}

violet: {} Person {firstName: 'Violet'}

({} Person).print
violet.print

# Lady MacBeth
# Violet MacBeth
```

##### 9. Any logic blocks returned inside another logic block are now bound to the scope in which they were accessed. For example:

```bash
x: {a: 1, {a + 1}}
y: {a: 5} x
z: {q: {a + 2}, q}

y @console.log
{a: 2} z @console.log

# 2
# 4
```

### Boolean Logic Truth Table

| A | B | Syntax   | Result | Syntax   | Result |
|---|---|----------|--------|----------|--------|
|   |   | *and*    |        | *nand*   |        |
| F | F | `A && B` | F      | `A !! B` | T      |
| F | T | `A && B` | F      | `A !! B` | T      |
| T | F | `A && B` | F      | `A !! B` | T      |
| T | T | `A && B` | T      | `A !! B` | F      |
|   |   | *or*     |        | *nor*    |        |
| F | F | `A || B` | F      | `A <> B` | T      |
| F | T | `A || B` | T      | `A <> B` | F      |
| T | F | `A || B` | T      | `A <> B` | F      |
| T | T | `A || B` | T      | `A <> B` | F      |
|   |   | *xor*    |        | *nxor*   |        |
| F | F | `A >< B` | F      | `A ~~ B` | T      |
| F | T | `A >< B` | T      | `A ~~ B` | F      |
| T | F | `A >< B` | T      | `A ~~ B` | F      |
| T | T | `A >< B` | F      | `A ~~ B` | T      |
|   |   | *(none)* |        | *not*    |        |
| F |   | `A`      | F      | `!A`     | T      |
| T |   | `A`      | T      | `!A`     | F      |

### Default Injectables

`@` contains a reference to the current scope.

`@System` contains I/O operations.

`@Scope` contains Scope constructor.

`@String` contains String constructor.

`@Boolean` contains Boolean constructor.

`@Number` contains Number constructor.

`@Date` contains Date constructor.

`@Array` contains Array constructor.

`@True` contains boolean true.

`@False` contains boolean false.

`@Null` contains null.

`@undefined` contains undefined.

`@Error, @typeError, @ValueError, ...` contain standard errors.

### Examples

```bash
'Hello World' @console.log

# Hello World
```

```bash
Hello: {
  ['Hello', what].each {
    @it @console.log
  }
}

{what: 'World'} Hello

# Hello
# World

what: 'Planet', @ Hello

# Hello
# Planet
```

```bash
Adder: {a + b}

AddFour: {a: 4, Adder}

{b: 6} AddFour @console.log

# 10
```

```bash
ValidateName: {
  name @String.isInstanceOf || 'Name must be a string' @typeError ^
  name.length < 5           && 'Name must be at least 5 characters long' @ValueError ^
}

= @typeError {
  @it.message @console.log
}

= @ValueError {
  `There was an error with the name: ${@it.message}` @console.log
}

{name: 'Bob'} ValidateName

'Success, the name is ok' @console.log

# There was an error with the name: Name must be at least 5 characters long
```

```bash
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

sarah.description @console.log
bob.description @console.log

# Person: Sarah
# Employee: Bob making 65000 per year
```
