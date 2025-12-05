/**
 * Result Pattern - Type-safe error handling
 * 
 * Senior pattern: Avoid throwing exceptions in business logic.
 * Use Result type to make success/failure explicit.
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
    readonly success = true as const;
    constructor(public readonly value: T) { }
}

export class Failure<E = Error> {
    readonly success = false as const;
    constructor(public readonly error: E) { }
}

export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E = Error>(error: E): Failure<E> => new Failure(error);

/**
 * Helper to check if result is success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
    return result.success;
}

/**
 * Helper to check if result is failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
    return !result.success;
}
