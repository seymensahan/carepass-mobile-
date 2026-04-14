/**
 * DatePickerField — kept as a thin wrapper around BeautifulDatePicker
 * for backwards compatibility. New code should import BeautifulDatePicker directly.
 */
import React from "react";
import BeautifulDatePicker from "./BeautifulDatePicker";

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  mode = "date",
  placeholder,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  // Map legacy "time" mode to "datetime" since the beautiful picker doesn't have time-only
  const effectiveMode = mode === "time" ? "datetime" : mode;

  return (
    <BeautifulDatePicker
      label={label}
      value={value}
      onChange={onChange}
      mode={effectiveMode}
      placeholder={placeholder}
      minDate={minimumDate}
      maxDate={maximumDate}
    />
  );
}
