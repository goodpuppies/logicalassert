/**
 * @module LogicalAssert
 * This module provides the main `assert` function for the LogicalAssert library.
 * It enables declarative, type-safe conditional logic and assertions.
 * 
 * @example
 * ```typescript
 * import { assert } from "./LogicalAssert.ts"; // Or from JSR/CDN
 *
 * const value = "admin";
 * assert(value).with({
 *   admin: () => console.log("User is admin"),
 *   user: () => console.log("User is regular user"),
 *   unknown: () => console.log("Unknown user type")
 * });
 * // Output: User is admin
 * ```
 *
 * @example DSL Usage
 * ```typescript
 * import { assert } from "./LogicalAssert.ts";
 *
 * const data = { id: 1, type: "product", stock: 10 };
 * assert(data).with({
 *   productInStock: {
 *     condition: { type: "product", stock: "number" }, // stock must be a number and exist
 *     exec: (p) => {
 *       if (p.stock > 0) console.log(`Product ${p.id} is in stock: ${p.stock} units`);
 *       else console.log(`Product ${p.id} is out of stock`);
 *     }
 *   },
 *   unknown: (d) => console.log("Data is not a product or structure is unknown", d)
 * });
 * // Output: Product 1 is in stock: 10 units
 * ```
 */
import { assert as stdAssert } from "@std/assert";
import { evaluateDslCondition } from "./dsl.ts";
import type { LogicalAssertBuilder, HandlerArgumentForInference, UnionOfAllHandlerReturnTypes } from "./types.ts";


/**
 * Creates an assertion context for a given value, allowing for conditional
 * execution of handlers via a `.with()` method.
 *
 * The return type of the `.with()` method is automatically inferred as a union
 * of all possible return types from the provided handlers, making it highly
 * type-safe.
 *
 * @template TInput The type of the input `value` being asserted.
 * @param value The value to assert against.
 * @returns An object with a `.with()` method that accepts the handlers.
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert";
 *
 * // 1. The result is the return value of the matched handler.
 * const greeting = assert("world").with({
 *   world: () => "Hello, world!",
 *   unknown: () => "Hello, stranger!",
 * });
 * assertEquals(greeting, "Hello, world!");
 *
 * // 2. Type inference works across different return types.
 * const result = assert(typeof Deno).with({
 *   object: () => "Running in Deno", // returns string
 *   undefined: () => 123,             // returns number
 * });
 * // `result` is correctly typed as `string | number`.
 * if (typeof result === 'string') {
 *   assertEquals(result, "Running in Deno");
 * }
 *
 * // 3. An error is thrown if no handler matches and 'unknown' is missing.
 * try {
 *   assert("unexpected").with({
 *     expected: () => "this will not run",
 *   });
 * } catch (e) {
 *   // The error object is of type unknown, so we must verify it's an Error.
 *   // We can use the special `Error:` handler for this common case.
 *   assert(e).with({
 *     Error: (err) => {
 *       // `err` is automatically typed as `Error`.
 *       assertEquals(err.message.includes("Assertion failed for value: unexpected"), true);
 *     },
 *     unknown: () => "Caught a non-error value.",
 *   });
 * }
 * ```
 * 
 * @example
 * ```ts
 * // Using the special `Error:` handler to process caught errors.
 * import { assert } from "./LogicalAssert.ts";
 * 
 * try {
 *   throw new Error("Something went wrong!");
 * } catch (e) {
 *   const result = assert(e).with({
 *     Error: (err) => `Caught an error: ${err.message}`,
 *     unknown: () => "Caught a non-error value.",
 *   });
 *   console.log(result); // "Caught an error: Something went wrong!"
 * }
 * ```
 */
export function assert<TInput>(value: TInput): LogicalAssertBuilder<TInput> {
  return {
    with<THandlers extends HandlerArgumentForInference<TInput>>(
      handlers: THandlers
    ): UnionOfAllHandlerReturnTypes<THandlers> {
      // Special case: Handle `instanceof Error` with a dedicated `Error:` handler.
      if (handlers.Error && value instanceof Error) {
        return handlers.Error(value) as UnionOfAllHandlerReturnTypes<THandlers>;
      }

      const callSite = new Error().stack!.split('\n')[2]

      for (const key of Object.keys(handlers)) {
        if (key === 'unknown') continue
  
        const handler = handlers[key];
  
        // Support for conditional handlers
        if (typeof handler === 'object' && handler !== null && !Array.isArray(handler) && 'condition' in handler) {
          let isMatch = false;
          const condition = (handler as { condition: unknown }).condition;

          // Case 1: Simple boolean condition
          if (typeof condition === 'boolean') {
            isMatch = condition;
          }
          // Case 2: DSL - Object schema for type validation
          else if (typeof condition === 'object' && !Array.isArray(condition) && condition !== null) {
            isMatch = evaluateDslCondition(value, condition as Record<string, string | true>);
          }

          if (isMatch) {
            // If a match is found, check if an `exec` function exists.
            if (handler && typeof (handler as { exec?: unknown }).exec === 'function') {
              return (handler as { exec: (v: TInput) => unknown }).exec(value) as UnionOfAllHandlerReturnTypes<THandlers>;
            }
            // If `exec` is not provided, the condition itself is the assertion.
            // The inferred return type will be `true`.
            return true as UnionOfAllHandlerReturnTypes<THandlers>;
          }
          continue;
        }
  
        // Standard value-based matching
        if (typeof handler === 'function') {
          // New: Match by type name (e.g., 'string', 'number')
          // deno-lint-ignore valid-typeof
          if (typeof value === key) {
            return handler(value);
          }
  
          // Existing: Match by specific value
          if (typeof value === 'number' && !isNaN(Number(key))) {
            if (Number(key as string) === value) {
              return handler(value)
            }
          } else if (typeof value === 'boolean' && ['true', 'false'].includes(key)) {
            if (value === (key === 'true')) {
              return handler(value)
            }
          } else if (value === null && key === 'null') {
            return handler(value)
          } else if (value === key) {
            return handler(value)
          }
        }
      }
  
      if ('unknown' in handlers && typeof handlers.unknown === 'function') {
        return handlers.unknown(value);
      }
  
      const validValues = Object.keys(handlers)
        .filter(k => k !== 'unknown')
        .join(', ')
  
      stdAssert(false,
        `\nAssertion failed for value: ${value}\n` +
        `Valid values: ${validValues}\n` +
        `Got: ${value} typeof ${typeof value}\n` +
        `At: ${callSite}`
      )
    }
  }
}