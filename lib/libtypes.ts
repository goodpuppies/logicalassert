// --- Advanced Types for Inference --- 

// Describes a basic handler structure for a given input type TInput.
// 'any' is used as a placeholder for the return type, which will be inferred.
export type BaseHandlerForInference<TInput> = 
  // deno-lint-ignore no-explicit-any
  | ((value: any) => any) 
  // deno-lint-ignore no-explicit-any
  | { condition: boolean | Record<string, string | true>, exec?: (value: any) => any };

// Describes the structure of the 'handlers' argument for inference purposes.
// It's similar to AssertionHandlers but designed to help infer a union of return types.
export type HandlerArgumentForInference<TInput> = 
  & Omit<{ [key: string]: BaseHandlerForInference<TInput> }, 'unknown' | 'Error'>
  & { 
      // deno-lint-ignore no-explicit-any
      unknown?: (value: TInput) => any;
      // deno-lint-ignore no-explicit-any
      Error?: (error: Error) => any;
    };

// Utility type: Gets the actual return type of a single handler from its structure.
export type GetHandlerActualReturnType<THandler> = 
  THandler extends (...args: any) => any
  ? ReturnType<THandler> // It's a direct function handler
  : THandler extends { exec: (...args: any) => any } 
    ? ReturnType<THandler["exec"]> // It's a conditional handler with an exec property
    : THandler extends { condition: any } 
      ? true // It's a conditional handler without an exec, so its implicit return is true
      : never;

// Utility type: Computes the union of return types from all handlers in a THandlersObject.
export type UnionOfAllHandlerReturnTypes<THandlersObject> = {
  [K in keyof THandlersObject]: GetHandlerActualReturnType<THandlersObject[K]>
}[keyof THandlersObject];
