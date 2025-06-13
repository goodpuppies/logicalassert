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
 * assert(value)({
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
 * assert(data)({
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
import type { HandlerArgumentForInference, UnionOfAllHandlerReturnTypes } from "./libtypes.ts";
import type { LogicalAssertBuilder } from "./types.ts";


/**
 * Creates an assertion context for a given value, allowing for conditional
 * execution of handlers via a `.with()` method.
 *
 * @template TInput The type of the input `value` being asserted.
 *
 * @param value The value to assert against.
 * @returns An object with a `.with()` method that accepts the handlers.
 *
 * @example Basic usage with inferred return type:
 * ```typescript
 * const result = assert("hello").with({
 *   hello: () => "world", // returns string
 *   other: () => 123    // returns number
 * });
 * // result is typed as string | number
 * ```
 *
 * @example Specifying handler types explicitly:
 * ```typescript
 * import { assert, ValueHandler } from "./LogicalAssert.ts";
 * const userStatus = assert(user.role).with<AssertionHandlers<string, string | null>>({
 *   admin: () => "Administrator",
 *   editor: () => "Editor",
 *   viewer: () => "Viewer",
 *   unknown: () => null
 * });
 * // userStatus is typed as string | null
 * ```
 */
export function assert<TInput>(value: TInput): LogicalAssertBuilder<TInput> {
  return {
    with<THandlers extends HandlerArgumentForInference<TInput>>(
      handlers: THandlers
    ): UnionOfAllHandlerReturnTypes<THandlers> {
      const callSite = new Error().stack!.split('\n')[2]

      for (const key of Object.keys(handlers)) {
        if (key === 'unknown') continue
  
        const handler = handlers[key];
  
        // Support for conditional handlers
        if (
          typeof handler === 'object' &&
          handler !== null &&
          !Array.isArray(handler) &&
          'condition' in handler &&
          'exec' in handler &&
          typeof handler.exec === 'function'
        ) {
          let conditionMet = false;
          const condition = handler.condition;
  
          // Case 1: Simple boolean condition
          if (typeof condition === 'boolean') {
            conditionMet = condition;
          }
          // Case 2: DSL - Object schema for type validation
          else if (typeof condition === 'object' && !Array.isArray(condition) && condition !== null) {
            conditionMet = evaluateDslCondition(value, condition as Record<string, string | true>);
          }
  
          if (conditionMet) {
            return handler.exec(value);
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