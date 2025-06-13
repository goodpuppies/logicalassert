/**
 * @module dsl
 * This module provides the Domain Specific Language (DSL) evaluation logic for LogicalAssert.
 * It's used internally by the `assert` function to validate object structures against a schema.
 * 
 * @example
 * ```typescript
 * // This module is primarily used internally by LogicalAssert.ts.
 * // Direct usage is possible but less common.
 * import { evaluateDslCondition } from "./dsl.ts";
 *
 * const user = { name: "Alice", age: 30, city: "Wonderland" };
 * const schema1 = { name: 'string', age: 'number' };
 * console.log(evaluateDslCondition(user, schema1)); // true
 *
 * const schema2 = { name: 'string', country: true }; // 'country' must exist
 * console.log(evaluateDslCondition(user, schema2)); // false, 'country' is missing
 *
 * const data = { items: [1, 2], meta: undefined };
 * const schema3 = { items: 'array', meta: 'undefined' };
 * console.log(evaluateDslCondition(data, schema3)); // true
 * ```
 */
// lib/dsl.ts

/**
 * Evaluates if a given value matches a DSL condition schema.
 * The schema is an object where keys are property names expected on the value,
 * and values are either:
 *  - `true`: The property must exist and not be null/undefined.
 *  - A type string (e.g., 'string', 'number', 'boolean', 'array', 'undefined'):
 *    The property must exist and match the specified type.
 *    For 'undefined', the property's value must be undefined.
 *    For other types, the property must also be non-null.
 *
 * @param value The value to check against the schema.
 * @param schema The DSL condition schema object.
 * @returns `true` if the value matches the schema, `false` otherwise.
 */
export function evaluateDslCondition(
  value: unknown,
  schema: Record<string, string | true>
): boolean {
  if (typeof value !== 'object' || value === null) {
    // DSL object schemas can only match against actual objects.
    return false;
  }

  return Object.entries(schema).every(([prop, typeOrCheck]) => {
    if (!(prop in value)) {
      // If checking for 'undefined', a missing property is a match for that specific prop.
      // For all other checks, a missing property is a mismatch.
      return typeOrCheck === 'undefined';
    }

    const propValue = (value as Record<string, unknown>)[prop];

    // Case 1: Simple existence and non-null check (schema value is `true`)
    if (typeOrCheck === true) {
      return propValue != null; // Equivalent to propValue !== null && propValue !== undefined
    }

    // Case 2: Type string check (e.g., 'string', 'number', 'undefined')
    if (typeof typeOrCheck === 'string') {
      // First, handle the special case where we are explicitly checking for 'undefined'.
      if (typeOrCheck === 'undefined') {
        return typeof propValue === 'undefined';
      }

      // For all other type checks, the value cannot be null or undefined.
      if (propValue == null) {
        return false;
      }

      if (typeOrCheck === 'array') {
        return Array.isArray(propValue);
      }
      // deno-lint-ignore valid-typeof
      return typeof propValue === typeOrCheck;
    }

    // Should not happen if schema is well-formed (string | true)
    return false;
  });
}
