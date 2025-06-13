// --- INTERNAL - Advanced Types for Inference --- 
// These types are crucial for the library's internal type inference.
// They are exported to ensure correct type resolution for library consumers,
// but direct usage is generally not recommended unless you are deeply familiar
// with the library's type system.

/**
 * @internal
 * Describes the basic structure of a handler for a given input type `TInput`.
 * This type is used internally for inferring the return types of handlers.
 * 'any' is used as a placeholder for return types, which are precisely inferred elsewhere.
 */
export type BaseHandlerForInference<TInput> = 
  // deno-lint-ignore no-explicit-any
  | ((value: any) => any) 
  // deno-lint-ignore no-explicit-any
  | { condition: boolean | Record<string, string | true>, exec?: (value: any) => any };

/**
 * @internal
 * Describes the structure of the `handlers` argument passed to `.with()`.
 * This type is central to inferring the union of all possible return types from the handlers.
 * It's similar to `AssertionHandlers` but specifically designed for type inference.
 */
export type HandlerArgumentForInference<TInput> = 
  & Omit<{ [key: string]: BaseHandlerForInference<TInput> }, 'unknown' | 'Error'>
  & { 
      // deno-lint-ignore no-explicit-any
      unknown?: (value: TInput) => any;
      // deno-lint-ignore no-explicit-any
      Error?: (error: Error) => any;
    };

/**
 * @internal
 * Utility type to extract the actual return type from a single handler's structure.
 * It handles function handlers, conditional handlers with `exec`, and conditional handlers
 * without `exec` (which implicitly return `true`).
 */
export type GetHandlerActualReturnType<THandler> = 
  THandler extends (...args: any) => any
  ? ReturnType<THandler> // It's a direct function handler
  : THandler extends { exec: (...args: any) => any } 
    ? ReturnType<THandler["exec"]> // It's a conditional handler with an exec property
    : THandler extends { condition: any } 
      ? true // It's a conditional handler without an exec, so its implicit return is true
      : never;

/**
 * @internal
 * Utility type that computes the union of all possible return types from an object of handlers.
 * This is the magic that provides precise return type inference for the `.with()` method.
 */
export type UnionOfAllHandlerReturnTypes<THandlersObject> = {
  [K in keyof THandlersObject]: GetHandlerActualReturnType<THandlersObject[K]>
}[keyof THandlersObject];


// --- User-Facing Exported Types (Remain largely the same for clarity and explicit typing) ---

/**
 * Represents a handler function that takes a value of type `T` and returns a result of type `R`.
 */
export type ValueHandler<T, R> = (value: T) => R;

/**
 * Represents a conditional handler object.
 * - `condition`: A boolean or a DSL schema object.
 * - `exec`: A handler that is executed only if its `condition` is met.
 * The `condition` can be a boolean or a DSL schema object.
 * If `exec` is omitted, the handler will return `true` if the condition is met.
 */
export type ConditionalHandler<TInput, TOutput> = {
  condition: boolean | Record<string, string | true>;
  exec?: (value: TInput) => TOutput;
};

/**
 * Represents the fully resolved structure of the handlers object, where R is the unified return type.
 * Useful for documentation and for users who want to be explicit.
 */
export type AssertionHandlers<T, R> =
  & Omit<{ [key: string]: ValueHandler<T, R> | ConditionalHandler<T, R> }, 'unknown' | 'Error'>
  & { 
      unknown?: ValueHandler<T, R>;
      Error?: (error: Error) => R;
    };

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