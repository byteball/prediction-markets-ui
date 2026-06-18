import { validatePrice } from "./validatePrice";

describe("validatePrice", () => {
  it("accepts a finite number greater than zero", () => {
    expect(validatePrice(1)).toBe(1);
    expect(validatePrice(98123.45)).toBe(98123.45);
  });

  it("coerces numeric strings", () => {
    expect(validatePrice("50.5")).toBe(50.5);
  });

  it("rejects zero, negatives, NaN and non-numeric values", () => {
    expect(validatePrice(0)).toBeNull();
    expect(validatePrice(-1)).toBeNull();
    expect(validatePrice(NaN)).toBeNull();
    expect(validatePrice(Infinity)).toBeNull();
    expect(validatePrice(null)).toBeNull();
    expect(validatePrice(undefined)).toBeNull();
    expect(validatePrice("abc")).toBeNull();
  });
});
