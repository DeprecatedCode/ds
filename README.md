# ds
Default Script

## Syntax

### Blocks

`{ ... }` represents deferred scope.

`( ... )` represents grouping.

`[ ... ]` represents order.

`' ... '` represents string.

### Symbols

All words represent symbol names.

### Operators

`#` represents comment.

`.` represents property.

`:` represents key: value assignment.

`::` represents convenience (key: key) assignment.

`+, -, *, /` represents arithmetic.

`,` represents separation.

`^` represents terminal raise.

`=` represents receive raised event.

`@` represents named injection.

`<, <=, ==, !=, >=, >` represents comparison.

`&&, !!, ||, <>, ><, ~~, !` represents boolean logic (AND, NAND, OR, NOR, XOR, NXOR, NOT).

### Scope Rules

##### 1. The entire file starts out as a blank scope. Any properties defined are created in that scope. For example:

```bash
a: 1

a @System.print

# 1
```

##### 2. Any first-level child scopes share the scope in which they are invoked. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

@ x

a @System.print
x.a @System.print

# 1
# undefined
```

##### 3. Any scope pairs applied to each other are automatically isolated from the current scope. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

y: {} x    # Read: create a new scope since we are not invoking based on the parent

[a, x.a, y.a].each @System.print

# undefined
# undefined
# 1
```

##### 4. Scopes are not invoked until used. For example:

```bash
x: {a: 1, 2 @System.print}

({} x).a @System.print

# 2
# 1
```

##### 5. Two scopes can be merged by applying the second to the first. For example:

x: {a: 1}
y: {b: 2}
z: {c: 3}

q: x y  # Read: create q based on x and y
q z     # Read: execute z in the context of q

[q.a, q.b, q.c].each @System.print

# 1
# 2

##### 6. Any scope created within another scope has first-level access to the properties created in the parent. But it cannot create properties in the parent. For example: 

```bash
a: 1
x: {} {a::, b: b, c: 3}

[x.a, x.b, x.c] @System.print
[a, b, c] @System.print

# 1
# undefined
# 3
# 1
# undefined
# undefined

# 1
```

##### 7. A deferred scope block is executed by placing another deferred scope block next to it. These share scope as if they were the same object. For example:

```bash
{name: 'Jacob'} {name @System.print}

# Jacob
```

##### 8: The second scope block can modify properties created in the first, as they are executed in order. For example:

```bash
person: {
  firstName: 'Lady',
  lastName: 'MacBeth'
  
  print get: {
    `${firstName} ${lastName}` @System.print
  }
}

violet: person {firstName: 'Violet'}

violet.print

# Violet MacBeth
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

`@Undefined` contains undefined.

`@Error, @TypeError, @ValueError, ...` contain standard errors.

### Examples

```bash
'Hello World' @System.print

# Hello World
```

```bash
Hello: {
  ['Hello', what].each {
    @it @System.print
  }
}

{what: 'World'} Hello

# Hello
# World

what: 'Planet', Hello

# Hello
# Planet
```

```bash
Adder: {a + b}

AddFour: {a: 4, Adder}

{b: 6} AddFour @System.print

# 10
```

```bash
ValidateName: {
  name @String.isInstanceOf || 'Name must be a string' @TypeError ^
  name.length < 5           && 'Name must be at least 5 characters long' @ValueError ^
}

= @TypeError {
  @it.message @System.print
}

= @ValueError {
  `There was an error with the name: ${@it.message}` @System.print
}

{name: 'Bob'} ValidateName

'Success, the name is ok' @System.print

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

sarah.description @System.print
bob.description @System.print

# Person: Sarah
# Employee: Bob making 65000 per year
```
