import { useState, useEffect } from "react";

type _InputProps = {
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  className?: string;
};

export function BlurInput({ value, placeholder, onCommit, className }: _InputProps) {
  const [editValue, setEditValue] = useState<string|null>(value);

  // keep local state synced with external updates (like sockets)
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleBlur = () => {
    if (editValue !== value) {
      onCommit(editValue);
    }
  };

  return (
    <input
      className={className}
      value={editValue}
      placeholder={placeholder}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
}