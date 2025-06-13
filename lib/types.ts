import type { HandlerArgumentForInference, UnionOfAllHandlerReturnTypes } from "./libtypes.ts";

// --- User-Facing Exported Types (Remain largely the same for clarity and explicit typing) ---

/**
 * Represents a handler function that takes a value of type `T` and returns a result of type `R`.
 */
export type ValueHandler<T, R> = (value: T) => R;

/**
 * Represents a conditional handler object.
 * - `condition`: A boolean or a DSL schema object.
 * - `exec`: A `ValueHandler` to execute if the condition is met.
 */
export type ConditionalHandler<T, R> = {
  condition: boolean | Record<string, string | true>;
  exec: ValueHandler<T, R>;
};

/**
 * Represents the fully resolved structure of the handlers object, where R is the unified return type.
 * Useful for documentation and for users who want to be explicit.
 */
export type AssertionHandlers<T, R> =
  & Omit<{ [key: string]: ValueHandler<T, R> | ConditionalHandler<T, R> }, 'unknown'>
  & { unknown?: ValueHandler<T, R> };

/**
 * The builder object returned by `assert()`, providing the `.with()` method.
 */
export interface LogicalAssertBuilder<TInput> {
  /**
   * Evaluates handlers against the asserted value.
   * The return type is inferred as a union of all possible return types from the handlers.
   *
   * @template THandlers The actual type of the handlers object being passed.
   * @param handlers An object where keys map to handler functions or conditional handler objects.
   * @returns The result from the matched handler. The type is a union of all possible handler return types.
   */
  with<THandlers extends HandlerArgumentForInference<TInput>>(
    handlers: THandlers
  ): UnionOfAllHandlerReturnTypes<THandlers>;
}