/** Immutable value: built once, through a factory that validates it. */
export abstract class ValueObjectBase<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = Object.freeze(value);
  }

  get value(): T {
    return this._value;
  }
}
