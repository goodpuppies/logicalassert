// --- Advanced Types for Inference --- 

// Describes a basic handler structure for a given input type TInput.
// 'any' is used as a placeholder for the return type, which will be inferred.
export type BaseHandlerForInference<TInput> = 
  // deno-lint-ignore no-explicit-any
  | ((value: any) => any) 
  // deno-lint-ignore no-explicit-any
  | { condition: boolean | Record<string, string | true>, exec: (value: any) => any };

// Describes the structure of the 'handlers' argument for inference purposes.
// It's similar to AssertionHandlers but designed to help infer a union of return types.
export type HandlerArgumentForInference<TInput> = 
  & Omit<{ [key: string]: BaseHandlerForInference<TInput> }, 'unknown'>
  // deno-lint-ignore no-explicit-any
  & { unknown?: (value: TInput) => any };

// Utility type: Gets the actual return type of a single handler from its structure.
export type GetHandlerActualReturnType<THandler> = 
  // deno-lint-ignore no-explicit-any
  THandler extends (value: any) => infer Ret ? Ret :
  // deno-lint-ignore no-explicit-any
  THandler extends { exec: (value: any) => infer RetExec } ? RetExec :
  never;

// Utility type: Computes the union of return types from all handlers in a THandlersObject.
export type UnionOfAllHandlerReturnTypes<THandlersObject> = {
  [K in keyof THandlersObject]: GetHandlerActualReturnType<THandlersObject[K]>
}[keyof THandlersObject];
