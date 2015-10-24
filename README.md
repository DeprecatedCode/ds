# ds
Default Script

## Syntax

### Blocks

`{ ... }` represents logic.

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

## Scope Rules

##### 1. The entire file starts out as a blank scope. Any properties defined are created in that scope. For example:

```bash
a: 1

a @System.print

# 1
```

##### 2. Any logic blocks share the scope in which they are invoked. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

@ x

a @System.print
x.a @System.print

# 1
# undefined
```

##### 3. Any logic block pairs applied to each other are automatically isolated from the current scope. For example:

```bash
x: {a: 1}  # Read: x is something that sets a to 1 on any scope

y: {} x    # Read: create a new scope since we are not invoking based on the parent

[a, x.a, y.a].each @System.print

# undefined
# undefined
# 1
```

##### 4. Logic blocks are not invoked until used. For example:

```bash
x: {a: 1, 2 @System.print}

({} x).a @System.print

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

[q.a, q.b, q.c, a, b, c].each @System.print

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

[x.a, x.b, x.c] @System.print
[a, b, c] @System.print

# 1
# undefined
# 3
# 1
# undefined
# undefined
```

##### 7. The new scope will be returned by the operation of two logic blocks and can be continually chained. For example:

```bash
{name: 'Jacob'} {name @System.print} {name: `Superhero ${name}`} {name @System.print}

# Jacob
# Superhero Jacob
```

##### 8. The logic blocks themselves will not be changed upon invocation. For example:

```bash
Person: {
  firstName: 'Lady'
  lastName: 'MacBeth'
  
  print get: {
    `${firstName} ${lastName}` @System.print
  }
}

violet: {} Person {firstName: 'Violet'}

({} Person).print
violet.print

# Lady MacBeth
# Violet MacBeth
```

##### 9. Any logic blocks returned inside another logic block are now bound to the scope in which they were accessed. For example:

x: {a: 1, {a + 1}}
y: {a: 5} x
z: {q: {a + 2}, q}

y @System.print
{a: 2} z @System.print

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

what: 'Planet', @ Hello

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
