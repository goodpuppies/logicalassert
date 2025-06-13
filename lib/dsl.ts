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
 * const schema2: Record<string, string | true> = { name: 'string', country: true }; // 'country' must exist
 * console.log(evaluateDslCondition(user, schema2)); // false, 'country' is missing
 *
 * const data = { items: [1, 2], meta: undefined };
 * const schema3 = { items: 'array', meta: 'undefined' };
 * console.log(evaluateDslCondition(data, schema3)); // true
 * ```
 */
// lib/dsl.ts

/**
 * Evaluates if a given `value` matches a DSL `schema`.
 *
 * This function is particularly useful for validating the shape of objects.
 * The `schema` is a record where keys correspond to property names in the `value`
 * and values define the expected type or existence of that property.
 *
 * @param value The object to evaluate.
 * @param schema A record defining the validation rules.
 *   - `true`: The property must exist and not be `null` or `undefined`.
 *   - `'string'`, `'number'`, `'boolean'`, `'object'`: The property must be of this `typeof`.
 *   - `'array'`: The property must be an `Array`.
 *   - `'undefined'`: The property must not exist on the object or be explicitly `undefined`.
 * @returns `true` if the `value` matches the `schema`, `false` otherwise.
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert";
 *
 * const user = { name: "John", age: 30, roles: ["admin", "editor"] };
 *
 * // Check for property existence and type
 * const isValidUser = evaluateDslCondition(user, {
 *   name: "string",
 *   age: "number",
 *   roles: "array",
 * });
 * assertEquals(isValidUser, true);
 *
 * // Check for a missing property
 * const isMissingEmail = evaluateDslCondition(user, { email: "undefined" });
 * assertEquals(isMissingEmail, true);
 *
 * // Fails if a property has the wrong type
 * const isInvalid = evaluateDslCondition(user, { age: "string" });
 * assertEquals(isInvalid, false);
 *
 * // Fails if a required property (checked with `true`) is missing
 * const schemaForMissingProp: Record<string, string | true> = { name: "string", nonExistentProp: true };
 * const evaluationResultForMissingProp = evaluateDslCondition(user, schemaForMissingProp);
 * assertEquals(evaluationResultForMissingProp, false); // user (defined above) doesn't have nonExistentProp
 * ```
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
