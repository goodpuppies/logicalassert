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

/**
 * Creates an assertion context for a given value, allowing for conditional
 * execution of handlers based on the value's type, specific value, or a DSL schema.
 *
 * @param value The value to assert against. Can be of any type.
 * @returns A function that accepts a handlers object. This function, when called,
 *   evaluates the handlers and executes the appropriate one.
 *
 * @template T The type of the value being asserted.
 *
 * The `handlers` object maps keys to handler functions or conditional handler objects.
 * - **Value Matching**: If a key matches the `value` (e.g., `value` is "admin", key is "admin"),
 *   the corresponding function is called with `value`.
 * - **Type Matching**: If a key matches the `typeof value` (e.g., `value` is 123, key is "number"),
 *   the corresponding function is called with `value`.
 * - **Conditional Handlers**: An object with `condition` and `exec` properties.
 *   - `condition`: Can be a boolean or a DSL schema object (see `evaluateDslCondition` in `dsl.ts`).
 *   - `exec`: A function to call if the `condition` is met. Receives `value`.
 * - **`unknown` Handler**: A special handler function (key: "unknown") that is called if no other
 *   handler matches. If not provided and no match is found, an `AssertionError` is thrown.
 *
 * @throws {Error} An `AssertionError` (via `stdAssert`) if no handler matches and no `unknown` handler is provided.
 *   The error message includes the value, its type, valid handler keys, and the call site.
 */
export function assert(value: unknown) {
  return function (handlers: { [x: string]: unknown; unknown?: unknown; }) {
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