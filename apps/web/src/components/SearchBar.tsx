import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, Loader2Icon, SearchIcon, XIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSearchProductsQuery } from '../queries/catalogue.queries';
import { useRecentSearchesStore } from '../stores/recent-searches.store';

const SUGGESTION_LIMIT = 5;
const MIN_SUGGEST_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Live-search combobox in the header: debounced product suggestions as
 * you type, recent searches when the field is empty, full keyboard
 * navigation (arrow keys, Enter, Escape), and a clear button. Pressing
 * Enter without a suggestion highlighted - or clicking "View all results" -
 * still goes to the full /search results page exactly as before; this is
 * additive, not a replacement for that page.
 */
export function SearchBar() {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const navigate = useNavigate();

  const recentSearches = useRecentSearchesStore((state) => state.terms);
  const addRecentSearch = useRecentSearchesStore((state) => state.addTerm);
  const removeRecentSearch = useRecentSearchesStore((state) => state.removeTerm);

  const trimmedTerm = term.trim();
  const debouncedTerm = useDebouncedValue(trimmedTerm, DEBOUNCE_MS);
  const showingRecent = trimmedTerm.length === 0;
  const showingSuggestions = debouncedTerm.length >= MIN_SUGGEST_LENGTH;

  const { data: results, status, fetchStatus } = useSearchProductsQuery(debouncedTerm, MIN_SUGGEST_LENGTH);
  const isSuggestLoading = showingSuggestions && (status === 'pending' || (status === 'success' && fetchStatus === 'fetching'));
  const suggestions = showingSuggestions ? (results ?? []).slice(0, SUGGESTION_LIMIT) : [];

  // Close on an outside click; Escape and blur-to-nowhere are handled separately.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Re-anchor the highlighted row whenever the visible item set changes,
  // so an index from a longer/shorter previous list never points past
  // the end (or stays stuck on a row that no longer exists).
  useEffect(() => {
    setActiveIndex(-1);
  }, [showingRecent, debouncedTerm]);

  function goToResults(searchTerm: string) {
    const clean = searchTerm.trim();
    if (clean.length === 0) return;
    addRecentSearch(clean);
    setIsOpen(false);
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  }

  function goToProduct(id: number) {
    setIsOpen(false);
    inputRef.current?.blur();
    navigate(`/products/${id}`);
  }

  function applyRecentSearch(value: string) {
    setTerm(value);
    goToResults(value);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    goToResults(term);
  }

  function handleClear() {
    setTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  }

  // Keyboard nav operates over whichever flat list is currently showing:
  // recent searches when the field is empty, or suggestions (plus a
  // trailing "view all" row) once there's a term.
  const itemCount = showingRecent ? recentSearches.length : suggestions.length + (showingSuggestions ? 1 : 0);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!isOpen || itemCount === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % itemCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + itemCount) % itemCount);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      if (showingRecent) {
        applyRecentSearch(recentSearches[activeIndex]);
      } else if (activeIndex < suggestions.length) {
        goToProduct(suggestions[activeIndex].id);
      } else {
        goToResults(term);
      }
    }
  }

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;
  const dropdownVisible = isOpen && (showingRecent ? recentSearches.length > 0 : showingSuggestions);

  return (
    <div ref={containerRef} className="relative ml-auto w-full max-w-[460px]">
      <form onSubmit={handleSubmit} role="search">
        {/* A real type="submit" button, not a decorative icon: the
            acceptance criteria says "click the search button", not
            "press Enter" - this is the literal element that satisfies it,
            Enter-to-submit is the (also supported) bonus, not a
            replacement for it. */}
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <SearchIcon className="size-4" />
        </button>
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={dropdownVisible}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          placeholder="Search products..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="rounded-full pl-9 pr-9"
        />
        {term.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </form>

      {dropdownVisible && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={showingRecent ? 'Recent searches' : 'Search suggestions'}
          className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-lg border bg-popover py-1.5 shadow-md"
        >
          {showingRecent &&
            recentSearches.map((value, index) => (
              <div
                key={value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyRecentSearch(value)}
                className={cn(
                  'flex cursor-default items-center gap-2.5 px-3 py-2 text-sm',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{value}</span>
                <button
                  type="button"
                  aria-label={`Remove "${value}" from recent searches`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(value);
                  }}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}

          {!showingRecent && isSuggestLoading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Searching...
            </div>
          )}

          {!showingRecent && !isSuggestLoading && suggestions.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">No quick matches for "{debouncedTerm}"</div>
          )}

          {!showingRecent &&
            !isSuggestLoading &&
            suggestions.map((product, index) => (
              <div
                key={product.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToProduct(product.id)}
                className={cn(
                  'flex cursor-default items-center gap-3 px-3 py-2 text-sm',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <img src={product.imageUrl} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
                <span className="flex-1 truncate">{product.title}</span>
                <span className="shrink-0 text-muted-foreground">${product.price.toFixed(2)}</span>
              </div>
            ))}

          {!showingRecent && (
            <div
              id={`${listboxId}-option-${suggestions.length}`}
              role="option"
              aria-selected={activeIndex === suggestions.length}
              onMouseEnter={() => setActiveIndex(suggestions.length)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToResults(term)}
              className={cn(
                'cursor-default border-t px-3 py-2 text-sm font-medium text-primary',
                activeIndex === suggestions.length && 'bg-accent',
              )}
            >
              View all results for "{debouncedTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
