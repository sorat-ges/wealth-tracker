import { useEffect, useRef, useState } from "react";
import { formatNumberInput, toNumber } from "../utils/format";

type MoneyInputProps = {
  name: string;
  defaultValue?: number;
  min?: number;
  required?: boolean;
  placeholder?: string;
};

export function MoneyInput({ name, defaultValue, min, required, placeholder }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(formatDefaultValue(defaultValue));

  useEffect(() => {
    setValue(formatDefaultValue(defaultValue));
  }, [defaultValue]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) {
      return undefined;
    }

    const handleReset = () => setValue(formatDefaultValue(defaultValue));
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue]);

  return (
    <input
      ref={inputRef}
      name={name}
      inputMode="decimal"
      type="text"
      min={min}
      required={required}
      placeholder={placeholder}
      value={value}
      onBlur={() => {
        setFocused(false);
        setValue(value.trim() ? formatNumberInput(toNumber(value)) : "");
      }}
      onChange={(event) => setValue(event.currentTarget.value)}
      onFocus={() => {
        setFocused(true);
        setValue(value.trim() ? String(toNumber(value)) : "");
      }}
      data-focused={focused ? "true" : "false"}
    />
  );
}

function formatDefaultValue(value: number | undefined) {
  return value === undefined ? "" : formatNumberInput(value);
}
