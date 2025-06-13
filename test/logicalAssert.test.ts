// c:\Git\LogicalAssert\test\logicalAssert.test.ts
import { assert } from "../lib/LogicalAssert.ts";
import { assertEquals, assertThrows } from "jsr:@std/assert";


// --- Basic Value Matching --- 
Deno.test("Basic Value Matching - String", () => {
  let executed = false;
  assert("hello")({
    hello() { executed = true; },
    world() { executed = false; }
  });
  assertEquals(executed, true, "Should match 'hello'");
});

Deno.test("Basic Value Matching - Number", () => {
  let executed = false;
  assert(42)({
    42() { executed = true; },
    43() { executed = false; }
  });
  assertEquals(executed, true, "Should match 42");
});



Deno.test("Basic Value Matching - Boolean false", () => {
  let executed = false;
  assert(false)({
    false() { executed = true; },
    true() { executed = false; }
  });
  assertEquals(executed, true, "Should match false");
});

Deno.test("Basic Value Matching - Null", () => {
  let executed = false;
  assert(null)({
    null() { executed = true; },
    undefined() { executed = false; }
  });
  assertEquals(executed, true, "Should match null");
});

Deno.test("Basic Value Matching - Undefined", () => {
  let executed = false;
  assert(undefined)({
    undefined() { executed = true; },
    null() { executed = false; }
  });
  assertEquals(executed, true, "Should match undefined");
});

// --- Type-Based Matching --- 
Deno.test("Type Matching - String", () => {
  let executed = false;
  assert("test string")({
    string(val: string) {
      executed = true;
      assertEquals(val, "test string");
    },
    number() { executed = false; }
  });
  assertEquals(executed, true, "Should match type 'string'");
});

Deno.test("Type Matching - Number", () => {
  let executed = false;
  assert(123)({
    number(val: number) {
      executed = true;
      assertEquals(val, 123);
    },
    string() { executed = false; }
  });
  assertEquals(executed, true, "Should match type 'number'");
});

// --- DSL Schema Validation --- 
interface TestObject {
  name: string;
  age?: number;
  isActive: boolean;
  tags: string[];
  address?: { street: string; city: string; };
  jobTitle?: undefined;
}

Deno.test("DSL Schema - Basic Property Existence", () => {
  const obj: TestObject = { name: "Alice", isActive: true, tags: ["a"] };
  let executed = false;
  assert(obj)({
    match: {
      condition: { name: true, isActive: true },
      exec(val: TestObject) {
        executed = true;
        assertEquals(val.name, "Alice");
      }
    }
  });
  assertEquals(executed, true, "Should match basic property existence");
});

Deno.test("DSL Schema - Property Type String", () => {
  const obj: TestObject = { name: "Bob", age: 30, isActive: false, tags: ["b", "c"] };
  let executed = false;
  assert(obj)({
    match: {
      condition: { name: 'string', age: 'number', isActive: 'boolean' },
      exec(val: TestObject) {
        executed = true;
        assertEquals(val.age, 30);
      }
    }
  });
  assertEquals(executed, true, "Should match property types");
});

Deno.test("DSL Schema - Property Type Array", () => {
  const obj: TestObject = { name: "Charlie", isActive: true, tags: ["x", "y", "z"] };
  let executed = false;
  assert(obj)({
    match: {
      condition: { tags: 'array' },
      exec(val: TestObject) {
        executed = true;
        assertEquals(val.tags.length, 3);
      }
    }
  });
  assertEquals(executed, true, "Should match 'array' type");
});

Deno.test("DSL Schema - Property Type Undefined (Present)", () => {
  const obj: TestObject = { name: "David", isActive: false, tags: [], jobTitle: undefined };
  let executed = false;
  assert(obj)({
    match: {
      condition: { jobTitle: 'undefined' },
      exec(val: TestObject) {
        executed = true;
        assertEquals(typeof val.jobTitle, 'undefined');
      }
    }
  });
  assertEquals(executed, true, "Should match 'undefined' type for present undefined property");
});

Deno.test("DSL Schema - Property Type Undefined (Missing)", () => {
  const obj: TestObject = { name: "Eve", isActive: true, tags: [] }; // jobTitle is missing
  let executed = false;
  assert(obj)({
    match: {
      condition: { jobTitle: 'undefined' }, // This should match because 'undefined' check allows missing props
      exec() {
        executed = true;
      }
    }
  });
  assertEquals(executed, true, "Should match 'undefined' type for missing property");
});

Deno.test("DSL Schema - Mismatch (Wrong Type)", () => {
  const obj = { name: "Frank", age: "40" }; // age is string, schema expects number
  let executed = false;
  assert(obj)({
    match: {
      condition: { name: 'string', age: 'number' },
      exec() { executed = true; /* Should not run */ }
    },
    unknown() { executed = false; /* This will run if no other match */ }
  });
  assertEquals(executed, false, "Should not match due to wrong type, unknown should not be called yet as it's not the only handler");
});

Deno.test("DSL Schema - Mismatch (Missing Property for 'true' check)", () => {
  const obj = { name: "Grace" }; // age is missing
  let executedMatchHandler = false;
  assert(obj)({
    match: {
      condition: { name: 'string', age: true },
      exec() { executedMatchHandler = true; /* Should not run */ }
    },
    unknown() { /* This will be called as 'match' condition is false */ }
  });
  assertEquals(executedMatchHandler, false, "Match handler should not execute due to missing property for 'true' check");
});

// --- Conditional Handlers (Boolean) --- 
Deno.test("Conditional Handler - Boolean True", () => {
  let executed = false;
  assert("data")({
    process: {
      condition: true,
      exec(val: string) {
        executed = true;
        assertEquals(val, "data");
      }
    }
  });
  assertEquals(executed, true, "Should execute handler with true condition");
});

Deno.test("Conditional Handler - Boolean False", () => {
  let processHandlerRan = false;
  let unknownHandlerRan = false;
  assert("data")({
    process: {
      condition: false,
      exec() { processHandlerRan = true; /* Should not run */ }
    },
    unknown() { unknownHandlerRan = true; /* This will run as 'process' condition is false */ }
  });
  assertEquals(processHandlerRan, false, "Process handler with false condition should not run");
  assertEquals(unknownHandlerRan, true, "Unknown handler should run when other conditions are not met");
});

// --- Unknown Handler --- 
Deno.test("Unknown Handler - Basic", () => {
  let executed = false;
  assert("unexpected value")({
    expected() { executed = false; },
    unknown(val: string) {
      executed = true;
      assertEquals(val, "unexpected value");
    }
  });
  assertEquals(executed, true, "Should execute unknown handler");
});

// --- Error on Unhandled Cases --- 
Deno.test("Error on Unhandled - No Unknown Handler", () => {
  assertThrows(() => {
    assert("unhandled")({
      handled() { /* do nothing */ }
    });
  }, Error, "Assertion failed for value: unhandled", "Should throw error for unhandled case without unknown handler");
});

Deno.test("Error on Unhandled - DSL Mismatch, No Unknown", () => {
  const obj = { type: "wrong" };
  assertThrows(() => {
    assert(obj)({
      match: {
        condition: { type: "correct" },
        exec() { /* do nothing */ }
      }
    });
  }, Error, "Assertion failed for value: [object Object]", "Should throw error for DSL mismatch without unknown handler");
});

// --- From test.js: isAdmin example --- 
function isAdmin(user: string): boolean {
  let variable = false; // Default to false
  assert(user)({
    admin() { variable = true; },
    user() { variable = false; },
    // Implicitly, any other string for 'user' would cause an error if no 'unknown' handler
    // For this test, we'll assume 'admin' and 'user' are the only valid inputs
    // or rely on an 'unknown' handler if other inputs are possible but should yield 'false'.
    unknown() { variable = false; } // Or throw if only 'admin'/'user' are allowed
  });
  return variable;
}

Deno.test("isAdmin - 'admin' should be admin", () => {
  assertEquals(isAdmin('admin'), true);
});

Deno.test("isAdmin - 'user' should not be admin", () => {
  assertEquals(isAdmin('user'), false);
});

Deno.test("isAdmin - 'guest' (unknown) should not be admin", () => {
  assertEquals(isAdmin('guest'), false); // Assuming unknown defaults to not admin
});

Deno.test("isAdmin - unhandled without unknown (if unknown handler removed from isAdmin)", () => {
  // Temporarily redefine isAdmin without 'unknown' for this specific test
  function isAdminStrict(user: string): boolean {
    let variable = false;
    assert(user)({
        admin() { variable = true; },
        user() { variable = false; }
    });
    return variable;
  }
  assertThrows(() => isAdminStrict('test'), Error, "Assertion failed for value: test");
});

console.log("LogicalAssert test suite complete. Run with 'deno test'.");

