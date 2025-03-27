import React, { forwardRef, useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    { error, className = "", suggestions = [], onSuggestionSelect, ...props },
    ref
  ) => {
    const [activeSuggestion, setActiveSuggestion] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle input change and generate suggestions
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (props.onChange) {
        props.onChange(e);
      }

      if (value.length > 0) {
        const filtered = suggestions.filter(
          (suggestion) =>
            suggestion.toLowerCase().startsWith(value.toLowerCase()) &&
            suggestion.toLowerCase() !== value.toLowerCase()
        );
        setShowSuggestions(filtered.length > 0);
        if (filtered.length > 0) {
          setActiveSuggestion(filtered[0]);
          setSelectedIndex(0);
        } else {
          setActiveSuggestion("");
          setSelectedIndex(0);
        }
      } else {
        setShowSuggestions(false);
        setActiveSuggestion("");
        setSelectedIndex(0);
      }
    };

    // Handle clear input
    const handleClear = () => {
      if (props.onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(event);
      }
      setShowSuggestions(false);
      setActiveSuggestion("");
      setSelectedIndex(0);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }

      const filteredSuggestions = suggestions.filter(
        (suggestion) =>
          suggestion
            .toLowerCase()
            .startsWith((props.value as string).toLowerCase()) &&
          suggestion.toLowerCase() !== (props.value as string).toLowerCase()
      );

      switch (e.key) {
        case "Tab":
        case "Enter":
          if (activeSuggestion) {
            e.preventDefault();
            if (onSuggestionSelect) {
              onSuggestionSelect(activeSuggestion);
            }
            setShowSuggestions(false);
            setActiveSuggestion("");
            setSelectedIndex(0);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (filteredSuggestions.length > 0) {
            const nextIndex = (selectedIndex + 1) % filteredSuggestions.length;
            setSelectedIndex(nextIndex);
            setActiveSuggestion(filteredSuggestions[nextIndex]);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (filteredSuggestions.length > 0) {
            const prevIndex =
              selectedIndex === 0
                ? filteredSuggestions.length - 1
                : selectedIndex - 1;
            setSelectedIndex(prevIndex);
            setActiveSuggestion(filteredSuggestions[prevIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setActiveSuggestion("");
          setSelectedIndex(0);
          break;
      }
    };

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            ref={ref || inputRef}
            className={`
              w-full 
              text-[48px] 
              text-gray-900 
              font-ot 
              ot-semibold
              placeholder:text-gray-300
              bg-transparent
              border-none 
              outline-none 
              focus:ring-0 
              focus:outline-none
              [&::-webkit-calendar-picker-indicator]:opacity-0
              [&::-webkit-calendar-picker-indicator]:absolute
              [&::-webkit-calendar-picker-indicator]:right-0
              [&::-webkit-calendar-picker-indicator]:cursor-pointer
              ${error ? "text-red-500" : ""}
              ${className}
            `}
            {...props}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            list={props.list}
          />
          {activeSuggestion && props.value && showSuggestions && (
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <span className="text-gray-300 text-[48px] font-ot ot-semibold">
                <span className="invisible">{props.value as string}</span>
                <span>
                  {activeSuggestion.slice((props.value as string).length)}
                </span>
              </span>
            </div>
          )}
          {props.value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-8 h-8" />
            </button>
          )}
        </div>
        {error && (
          <p className="absolute -bottom-6 left-0 text-sm font-ot ot-regular mb-2 text-red-500">
            {error}
          </p>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            {suggestions
              .filter((suggestion) =>
                suggestion
                  .toLowerCase()
                  .startsWith((props.value as string).toLowerCase())
              )
              .map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-50 text-base font-ot ot-regular ${
                    index === selectedIndex ? "bg-gray-50" : ""
                  }`}
                  onClick={() => {
                    if (onSuggestionSelect) {
                      onSuggestionSelect(suggestion);
                    }
                    setShowSuggestions(false);
                    setActiveSuggestion("");
                    setSelectedIndex(0);
                  }}
                >
                  {suggestion}
                </div>
              ))}
          </div>
        )}
        <style>{`
          input[list] {
            position: relative;
          }
          input[list]::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            right: 0;
            cursor: pointer;
          }
          datalist {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            z-index: 50;
          }
          datalist option {
            padding: 0.5rem 1rem;
            font-size: 1rem;
            color: #6b7280;
            background-color: white;
            cursor: pointer;
            white-space: nowrap;
          }
          datalist option:hover {
            background-color: #f3f4f6;
          }
          datalist option:checked {
            background-color: #f3f4f6;
            color: #111827;
          }
        `}</style>
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export default CustomInput;
