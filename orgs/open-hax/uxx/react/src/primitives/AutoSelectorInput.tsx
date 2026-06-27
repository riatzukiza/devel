/**
 * AutoSelectorInput Component
 *
 * Implements the auto-selector-input.edn contract.
 * Text input with real-time option filtering and keyboard-navigable
 * suggestion dropdown. Supports controlled/uncontrolled modes,
 * freeSolo (arbitrary values), async option loading, and multi-select.
 */

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useId,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { Input } from './Input.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AutoSelectorOption<T = string> = {
  /** Unique identifier */
  value: T;
  /** Display label */
  label: string;
  /** Optional descriptive sub-text rendered below label */
  description?: string;
  /** Optional leading visual (icon, avatar node) */
  icon?: ReactNode;
  /** Prevents the option from being selected */
  disabled?: boolean;
  /** Groups this option under a named section header */
  group?: string;
};

export type AutoSelectorSize = 'sm' | 'md' | 'lg';
export type AutoSelectorVariant = 'default' | 'filled' | 'unstyled';

export interface AutoSelectorInputProps<T = string> {
  /** Static list of options. Ignored when `loadOptions` is provided. */
  options?: AutoSelectorOption<T>[];
  /**
   * Async option loader. Called with the current input value.
   * Takes precedence over `options` when provided.
   */
  loadOptions?: (query: string) => Promise<AutoSelectorOption<T>[]>;
  /**
   * Controlled selected value(s).
   * Pass an array for multi-select, a single value otherwise.
   */
  value?: T | T[];
  /** Default value for uncontrolled usage */
  defaultValue?: T | T[];
  /** Input placeholder text */
  placeholder?: string;
  /** Size token — matches Input sizing */
  size?: AutoSelectorSize;
  /** Visual variant — matches Input variants */
  variant?: AutoSelectorVariant;
  /** Allow the user to confirm an arbitrary value not in the options list */
  freeSolo?: boolean;
  /** Allow selecting multiple options */
  multiple?: boolean;
  /** Disable the entire control */
  disabled?: boolean;
  /** Mark field as having a validation error */
  error?: boolean;
  /** Message to display beneath the input when `error` is true */
  errorMessage?: string;
  /** Auto-highlight the first matching option on open */
  autoHighlight?: boolean;
  /**
   * Commit the highlighted option on blur.
   * Only applies when an option is actively highlighted.
   */
  autoSelect?: boolean;
  /**
   * Select all existing input text when the field receives focus.
   * Useful for quick-replace UX.
   */
  selectOnFocus?: boolean;
  /** Minimum characters required before the dropdown opens */
  minChars?: number;
  /** Debounce delay in ms for `loadOptions` calls (default: 300) */
  debounceMs?: number;
  /** Maximum number of options to show in the list */
  maxOptions?: number;
  /**
   * Custom render function for a single option row.
   * Overrides the default label + description layout.
   */
  renderOption?: (
    option: AutoSelectorOption<T>,
    state: { highlighted: boolean; selected: boolean }
  ) => ReactNode;
  /**
   * Custom filter function. Receives the full options list and the
   * current input text. Ignored when `loadOptions` is provided.
   */
  filterOptions?: (
    options: AutoSelectorOption<T>[],
    inputValue: string
  ) => AutoSelectorOption<T>[];
  /** Node to render inside the dropdown when no options match */
  noOptionsContent?: ReactNode;
  /** Node to render inside the dropdown while options are loading */
  loadingContent?: ReactNode;
  /** Called when the selected value changes */
  onChange?: (value: T | T[] | null) => void;
  /** Called on every keystroke with the current raw input string */
  onInputChange?: (inputValue: string) => void;
  /** Called when the dropdown opens */
  onOpen?: () => void;
  /** Called when the dropdown closes */
  onClose?: () => void;
  /** Input `name` attribute */
  name?: string;
  /** Input `id` attribute — used to link the label */
  id?: string;
  /** Leading icon passed through to the Input primitive */
  leftIcon?: ReactNode;
}

// ─── Default filter ──────────────────────────────────────────────────────────

function defaultFilter<T>(
  options: AutoSelectorOption<T>[],
  input: string
): AutoSelectorOption<T>[] {
  const q = input.toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const dropdownStyles: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1300,
  marginTop: `${tokens.spacing[1]}px`,
  backgroundColor: tokens.colors.background.surface,
  border: `1px solid ${tokens.colors.border.default}`,
  borderRadius: tokens.radius.md,
  boxShadow: tokens.shadow.md,
  overflow: 'hidden',
  maxHeight: '240px',
  overflowY: 'auto',
};

const listStyles: CSSProperties = {
  margin: 0,
  padding: `${tokens.spacing[1]}px 0`,
  listStyle: 'none',
};

const groupHeaderStyles: CSSProperties = {
  padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
  fontSize: tokens.fontSize.xs,
  fontWeight: 600,
  color: tokens.colors.text.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  userSelect: 'none',
};

const optionBaseStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: `${tokens.spacing[2]}px`,
  padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
  cursor: 'pointer',
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.default,
  userSelect: 'none',
};

const optionHighlightedStyles: CSSProperties = {
  backgroundColor: tokens.colors.background.hover,
};

const optionSelectedStyles: CSSProperties = {
  color: tokens.colors.text.accent,
  fontWeight: 500,
};

const optionDisabledStyles: CSSProperties = {
  color: tokens.colors.text.muted,
  cursor: 'not-allowed',
  opacity: 0.5,
};

const optionIconStyles: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  color: tokens.colors.text.muted,
};

const optionLabelStyles: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const optionDescriptionStyles: CSSProperties = {
  fontSize: tokens.fontSize.xs,
  color: tokens.colors.text.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const statusStyles: CSSProperties = {
  padding: `${tokens.spacing[3]}px ${tokens.spacing[3]}px`,
  fontSize: tokens.fontSize.sm,
  color: tokens.colors.text.muted,
  textAlign: 'center',
};

const containerStyles: CSSProperties = {
  position: 'relative',
  width: '100%',
};

// ─── Component ─────────────────────────────────────────────────────────��─────

/**
 * Text input with real-time suggestion dropdown.
 *
 * @example
 * // Static list, single select
 * <AutoSelectorInput
 *   options={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }]}
 *   placeholder="Choose a framework"
 *   onChange={(v) => console.log(v)}
 * />
 *
 * @example
 * // Async with debounce, freeSolo
 * <AutoSelectorInput
 *   loadOptions={async (q) => await searchUsers(q)}
 *   freeSolo
 *   debounceMs={400}
 *   onChange={(v) => setRecipient(v)}
 * />
 *
 * @example
 * // Multi-select with autoHighlight
 * <AutoSelectorInput
 *   options={tags}
 *   multiple
 *   autoHighlight
 *   selectOnFocus
 *   onChange={(values) => setTags(values as string[])}
 * />
 */
export const AutoSelectorInput = forwardRef<
  HTMLInputElement,
  AutoSelectorInputProps
>(
  (
    {
      options: staticOptions = [],
      loadOptions,
      value,
      defaultValue,
      placeholder,
      size = 'md',
      variant = 'default',
      freeSolo = false,
      multiple = false,
      disabled = false,
      error = false,
      errorMessage,
      autoHighlight = false,
      autoSelect = false,
      selectOnFocus = false,
      minChars = 0,
      debounceMs = 300,
      maxOptions,
      renderOption,
      filterOptions,
      noOptionsContent,
      loadingContent,
      onChange,
      onInputChange,
      onOpen,
      onClose,
      name,
      id,
      leftIcon,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const listboxId = `${inputId}-listbox`;

    const isControlled = value !== undefined;

    // ── Internal state ──
    const [inputValue, setInputValue] = useState('');
    const [selectedValues, setSelectedValues] = useState<unknown[]>(
      defaultValue !== undefined
        ? Array.isArray(defaultValue)
          ? defaultValue
          : [defaultValue]
        : []
    );
    const [filteredOptions, setFilteredOptions] = useState<AutoSelectorOption[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Resolve controlled selections
    const resolvedSelected = isControlled
      ? Array.isArray(value)
        ? value
        : value !== null && value !== undefined
        ? [value]
        : []
      : selectedValues;

    // ── Option filtering ──
    const computeOptions = useCallback(
      (query: string) => {
        const filter = filterOptions ?? defaultFilter;
        let results = filter(staticOptions, query);
        if (maxOptions !== undefined) results = results.slice(0, maxOptions);
        return results;
      },
      [staticOptions, filterOptions, maxOptions]
    );

    const openDropdown = useCallback(() => {
      if (!open) {
        setOpen(true);
        onOpen?.();
      }
    }, [open, onOpen]);

    const closeDropdown = useCallback(() => {
      if (open) {
        setOpen(false);
        setHighlightedIndex(-1);
        onClose?.();
      }
    }, [open, onClose]);

    // ── Input change handler ──
    const handleInputChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setInputValue(q);
        onInputChange?.(q);

        if (q.length < minChars) {
          closeDropdown();
          setFilteredOptions([]);
          return;
        }

        if (loadOptions) {
          setLoading(true);
          openDropdown();
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(async () => {
            try {
              let results = await loadOptions(q);
              if (maxOptions !== undefined) results = results.slice(0, maxOptions);
              setFilteredOptions(results);
              if (autoHighlight && results.length > 0) setHighlightedIndex(0);
            } finally {
              setLoading(false);
            }
          }, debounceMs);
        } else {
          const results = computeOptions(q);
          setFilteredOptions(results);
          if (results.length > 0) openDropdown();
          else closeDropdown();
          if (autoHighlight && results.length > 0) setHighlightedIndex(0);
          else setHighlightedIndex(-1);
        }
      },
      [
        minChars, loadOptions, debounceMs, maxOptions,
        autoHighlight, computeOptions, openDropdown, closeDropdown, onInputChange,
      ]
    );

    // ── Selection ──
    const selectOption = useCallback(
      (option: AutoSelectorOption) => {
        if (option.disabled) return;

        let next: unknown[];
        if (multiple) {
          const already = resolvedSelected.includes(option.value);
          next = already
            ? resolvedSelected.filter((v) => v !== option.value)
            : [...resolvedSelected, option.value];
        } else {
          next = [option.value];
          setInputValue(option.label);
        }

        if (!isControlled) setSelectedValues(next);
        onChange?.(multiple ? (next as never) : (next[0] as never) ?? null);
        if (!multiple) closeDropdown();
      },
      [multiple, resolvedSelected, isControlled, onChange, closeDropdown]
    );

    // ── Keyboard navigation ──
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (!open) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            openDropdown();
            setFilteredOptions(computeOptions(inputValue));
            return;
          }
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedIndex((i) =>
              i < filteredOptions.length - 1 ? i + 1 : 0
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex((i) =>
              i > 0 ? i - 1 : filteredOptions.length - 1
            );
            break;
          case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              selectOption(filteredOptions[highlightedIndex]);
            } else if (freeSolo && inputValue) {
              onChange?.(inputValue as never);
              closeDropdown();
            }
            break;
          case 'Escape':
            closeDropdown();
            setInputValue('');
            break;
          case 'Tab':
            if (autoSelect && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              selectOption(filteredOptions[highlightedIndex]);
            }
            closeDropdown();
            break;
          default:
            break;
        }
      },
      [
        open, filteredOptions, highlightedIndex, inputValue,
        freeSolo, autoSelect, openDropdown, closeDropdown,
        selectOption, onChange, computeOptions,
      ]
    );

    // ── Focus / blur ──
    const handleFocus = useCallback(() => {
      if (selectOnFocus && inputRef.current) {
        inputRef.current.select();
      }
      if (inputValue.length >= minChars) {
        const results = loadOptions ? filteredOptions : computeOptions(inputValue);
        setFilteredOptions(results);
        if (results.length > 0) openDropdown();
        if (autoHighlight && results.length > 0) setHighlightedIndex(0);
      }
    }, [
      selectOnFocus, inputValue, minChars, loadOptions,
      filteredOptions, computeOptions, openDropdown, autoHighlight,
    ]);

    const handleBlur = useCallback(() => {
      // Delay so that click on an option registers first
      setTimeout(() => {
        if (autoSelect && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        closeDropdown();
      }, 150);
    }, [autoSelect, highlightedIndex, filteredOptions, selectOption, closeDropdown]);

    // ── Cleanup debounce on unmount ──
    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    // ── Group options ──
    const grouped = filteredOptions.reduce<
      { group?: string; options: AutoSelectorOption[] }[]
    >((acc, opt) => {
      const existing = acc.find((g) => g.group === opt.group);
      if (existing) {
        existing.options.push(opt);
      } else {
        acc.push({ group: opt.group, options: [opt] });
      }
      return acc;
    }, []);

    // ── Flat index map for keyboard nav across groups ──
    const flatOptions = grouped.flatMap((g) => g.options);

    // ── Option item renderer ──
    const renderOptionItem = (
      opt: AutoSelectorOption,
      flatIndex: number
    ) => {
      const isHighlighted = flatIndex === highlightedIndex;
      const isSelected = resolvedSelected.includes(opt.value);

      const itemStyle: CSSProperties = {
        ...optionBaseStyles,
        ...(isHighlighted ? optionHighlightedStyles : {}),
        ...(isSelected ? optionSelectedStyles : {}),
        ...(opt.disabled ? optionDisabledStyles : {}),
      };

      const content = renderOption
        ? renderOption(opt, { highlighted: isHighlighted, selected: isSelected })
        : (
          <>
            {opt.icon && <span style={optionIconStyles}>{opt.icon}</span>}
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={optionLabelStyles}>{opt.label}</span>
              {opt.description && (
                <span style={optionDescriptionStyles}>{opt.description}</span>
              )}
            </span>
            {isSelected && !multiple && (
              <span aria-hidden="true" style={{ color: tokens.colors.text.accent }}>✓</span>
            )}
          </>
        );

      return (
        <li
          key={String(opt.value)}
          id={`${listboxId}-option-${flatIndex}`}
          role="option"
          aria-selected={isSelected}
          aria-disabled={opt.disabled}
          data-component="auto-selector-option"
          data-highlighted={isHighlighted || undefined}
          data-selected={isSelected || undefined}
          data-disabled={opt.disabled || undefined}
          style={itemStyle}
          onMouseEnter={() => setHighlightedIndex(flatIndex)}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur before selection
            selectOption(opt);
          }}
        >
          {content}
        </li>
      );
    };

    return (
      <div
        style={containerStyles}
        data-component="auto-selector-input"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
      >
        <Input
          ref={(node) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          id={inputId}
          name={name}
          value={inputValue || ''}
          placeholder={placeholder}
          size={size}
          variant={variant}
          disabled={disabled}
          error={error}
          errorMessage={errorMessage}
          leftIcon={leftIcon}
          autoComplete="off"
          aria-autocomplete="list"
          aria-activedescendant={
            open && highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {open && (
          <div style={dropdownStyles} data-component="auto-selector-dropdown">
            <ul
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple}
              style={listStyles}
            >
              {loading && (
                <li role="presentation" style={statusStyles}>
                  {loadingContent ?? 'Loading…'}
                </li>
              )}

              {!loading && flatOptions.length === 0 && (
                <li role="presentation" style={statusStyles}>
                  {noOptionsContent ?? 'No options'}
                </li>
              )}

              {!loading &&
                grouped.map((group) => (
                  <li key={group.group ?? '__ungrouped'} role="presentation">
                    {group.group && (
                      <div
                        style={groupHeaderStyles}
                        aria-hidden="true"
                        data-component="auto-selector-group-header"
                      >
                        {group.group}
                      </div>
                    )}
                    <ul role="group" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {group.options.map((opt) =>
                        renderOptionItem(opt, flatOptions.indexOf(opt))
                      )}
                    </ul>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

AutoSelectorInput.displayName = 'AutoSelectorInput';

export default AutoSelectorInput;