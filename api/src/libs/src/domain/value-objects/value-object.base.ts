/**
 * Immutable value. Equality by value, not by reference.
 */
export abstract class ValueObjectBase<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = Object.freeze(value);
  }

  get value(): T {
    return this._value;
  }
}
