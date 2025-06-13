# LogicalAssert: Ergonomic and Type-Safe Assertions for TypeScript/JavaScript

Assert style conditional programming!
- Assert, if else and switch case in one.
- Be forced to handle all relevant logic branches on any condition check, unexpected read's throw automatically.
- Better than errors as values imo.

`LogicalAssert` is a lightweight, powerful library for Deno, Node.js, and browsers that provides an ergonomic and declarative way to handle conditional logic and assertions. It shines when you need to execute different code paths based on the value or structure of an input, replacing complex `if/else if/else` chains or `switch` statements with a clean, readable, and type-safe approach.

## Say Goodbye to Unnecessary `let` Keywords

One common scenario requiring `let` is when a variable's value is determined by conditional logic. `LogicalAssert` elegantly solves this by allowing handlers to return values, which then become the result of the `assert` expression. This promotes a more functional style and enhances immutability.

**Before (with `let`):**

```typescript
function getRoleMessage(userType: string): string {
  let message: string;
  if (userType === "admin") {
    message = "Welcome, Administrator!";
  } else if (userType === "user") {
    message = "Hello, User!";
  } else {
    message = "Access denied.";
  }
  return message;
}
```

**After (with `LogicalAssert`):**

```typescript
import { assert } from "./lib/LogicalAssert.ts";
function getRoleMessage(userType: string): string {
  return assert(userType).with({
    admin: () => "Welcome, Administrator!",
    user: () => "Hello, User!",
    unknown: () => "Access denied."
  });
}

console.log(getRoleMessage("admin")); // Output: Welcome, Administrator!
console.log(getRoleMessage("guest")); // Output: Access denied.
```

This pattern ensures that `getRoleMessage` always returns a string (because an unhandled `userType` would throw an error), making your code more robust and predictable, all while using `const` or direct returns instead of `let`.

## Features

*   **Declarative Syntax**: Clearly express conditions and their corresponding actions.
*   **Value Matching**: Match against specific primitive values (strings, numbers, booleans, null, undefined).
*   **Type Matching**: Match against JavaScript types like `'string'`, `'number'`, `'boolean'`.
*   **DSL for Object Validation**: Define schemas to check for property existence and types (including `'array'` and `'undefined'`).
*   **Conditional Handlers**: Use boolean conditions or DSL schemas to gate execution.
*   **Type-Safe Handlers**: Handler functions receive the asserted value, often with inferred types based on the condition.
*   **Automatic Error for Unhandled Cases**: Throws an `AssertionError` if no condition is met and no `unknown` handler is provided, ensuring exhaustive checks.
*   **Async Handler Support**: Handlers can be async functions; simply `await` the `assert` call.

## Basic Usage

```typescript
import { assert } from "./lib/LogicalAssert.ts";
// 1. Value Matching
const value = "admin";
let role = "guest";

assert(value).with({
  admin() { role = "Administrator"; },
  user() { role = "Regular User"; },
  // throw on unknown
});
console.log(`Role: ${role}`); // Output: Role: Administrator

// 2. Type Matching
const input: unknown = 123;
assert(input).with({
  string(val: string) { console.log(`String: ${val.toUpperCase()}`); },
  number(val: number) { console.log(`Number: ${val.toFixed(2)}`); },
  boolean(val: boolean) { console.log(`Boolean: ${val}`); },
  unknown() { console.log("Unknown type"); }
});
// Output: Number: 123.00

// 3. DSL for Object Validation
interface UserProfile {
  id: number;
  username: string;
  isActive?: boolean;
  email?: string;
}

const profile1: UserProfile = { id: 1, username: "jane_doe", isActive: true };
const profile2: UserProfile = { id: 2, username: "john_doe", email: "john@example.com" };
const profile3: unknown = { id: 3 }; // Missing username

function processProfile(profile: unknown) {
  assert(profile).with({
    activeUser: {
      condition: { id: 'number', username: 'string', isActive: true },
      exec: (p: UserProfile) => console.log(`Active user: ${p.username}`)
    },
    userWithEmail: {
      condition: { id: 'number', username: 'string', email: 'string' },
      exec: (p: UserProfile) => console.log(`User with email: ${p.username} (${p.email})`)
    },
    incomplete: {
        condition: { id: 'number', username: 'undefined' }, // Check if username is missing or explicitly undefined
        exec: (p: {id: number}) => console.log(`Incomplete profile for ID: ${p.id}. Username is missing.`)
    },
    unknown(p) { console.log("Invalid or unknown profile structure:", p); }
  });
}

processProfile(profile1); // Output: Active user: jane_doe
processProfile(profile2); // Output: User with email: john_doe (john@example.com)
processProfile(profile3); // Output: Incomplete profile for ID: 3. Username is missing.

// 4. Unhandled Case Error
try {
  assert("unexpected").with({
    expected() { console.log("This won't run"); }
  });
} catch (e: any) {
  console.error("Caught expected error:", e.message.split('\n')[1]); // Assertion failed for value: unexpected
}
```

## Advanced Usage

### Conditional Handlers with Booleans

```typescript
import { assert } from "./lib/LogicalAssert.ts";
const count = 5;
assert(count).with({
  handlePositive: {
    condition: count > 0,
    exec: (val) => console.log(`Count is positive: ${val}`)
  },
  handleZeroOrNegative: {
    condition: count <= 0,
    exec: (val) => console.log(`Count is zero or negative: ${val}`)
  }
});
// Output: Count is positive: 5
```

### Async Handlers

```typescript
import { assert } from "./lib/LogicalAssert.ts";
async function fetchData(id: number): Promise<{ data: string }> {
  return new Promise(resolve => setTimeout(() => resolve({ data: `Data for ${id}` }), 50));
}

async function processItem(item: string | number) {
  return await assert(item).with({
    string: async (valStr: string) => {
      console.log(`Processing string: ${valStr}`);
      return `STRING_${valStr.toUpperCase()}`;
    },
    number: async (valNum: number) => {
      console.log(`Fetching data for number: ${valNum}`);
      const result = await fetchData(valNum);
      return `DATA_${result.data}`;
    }
  });
}

async function main() {
  const result1 = await processItem("test");
  console.log("Result 1:", result1); // Result 1: STRING_TEST

  const result2 = await processItem(123);
  console.log("Result 2:", result2); // Result 2: DATA_Data for 123
}

main();
```
