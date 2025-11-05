'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Command } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

interface Document {
  id: number;
  title: string;
  content: string;
  table_name: string;
  link?: string;
  metadata?: any;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = useCallback(async (searchText: string) => {
    if (searchText.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: searchText })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data || []);
        setError(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const searchText = event.target.value;
    setQuery(searchText);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchText);
    }, 300); // 300ms debounce delay
  }, [performSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    inputRef.current?.focus();
  }, []);

  const handleResultClick = useCallback((item: Document) => {
    if (item.link) {
      // If link already contains the full path, use it as is
      // Otherwise, construct the URL properly
      const url = item.link.startsWith('/') ? item.link + item.content : `/${item.link}${item.content}`;
      router.push(url);
    } 
    setQuery("");
    setResults([]);
    setError(null);
  }, [router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className={cn(
        "relative group",
        "transition-all duration-200 ease-in-out"
      )}>
        {/* Search Icon */}
        <div className={cn(
          "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
          "transition-all duration-200",
          isFocused ? "text-primary" : "text-muted-foreground"
        )}>
          <Search className={cn(
            "h-4 w-4 transition-all duration-200",
            isFocused && "scale-110"
          )} />
        </div>

        {/* Input Field */}
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isMobile ? "Search..." : "Search bills, payments, reports..."}
          className={cn(
            "w-full pl-10 pr-20 py-2.5 sm:py-3",
            "text-sm sm:text-base",
            "border-2 rounded-xl",
            "bg-background/50 backdrop-blur-sm",
            "transition-all duration-200 ease-in-out",
            "hover:border-primary/30 focus:border-primary",
            "focus:ring-2 focus:ring-primary/20",
            "shadow-sm hover:shadow-md focus:shadow-lg",
            isFocused && "scale-[1.02]"
          )}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute inset-y-0 right-12 pr-3 flex items-center",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-200",
              "rounded-full p-1 hover:bg-muted/50"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Keyboard Shortcut */}
        <div className={cn(
          "absolute inset-y-0 right-0 pr-3 flex items-center",
          "transition-all duration-200"
        )}>
          <kbd className={cn(
            "hidden sm:inline-flex items-center rounded-lg",
            "border border-border bg-muted/50 px-2 py-1",
            "text-xs font-mono text-muted-foreground",
            "transition-all duration-200",
            "hover:bg-muted"
          )}>
            <Command className="h-3 w-3 mr-1" />
            K
          </kbd>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute left-0 w-full mt-2">
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute left-0 w-full mt-2">
          <div className="flex items-center justify-center py-2 px-4">
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className={cn(
          "absolute left-0 w-full mt-2",
          "border border-border rounded-xl shadow-lg",
          "bg-background/95 backdrop-blur-sm",
          "z-50 max-h-[80vh] overflow-y-auto",
          "animate-in slide-in-from-top-2 duration-200"
        )}>
          <div className="p-2">
            {results.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleResultClick(item)}
                className={cn(
                  "border border-border rounded-lg p-3 mb-2",
                  "hover:bg-muted/50 transition-all duration-200",
                  "cursor-pointer group",
                  "hover:shadow-md hover:border-primary/30"
                )}
              >
                <div className="flex space-x-2">
                  {/* Table Name Badge */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      "bg-primary/10 text-primary border border-primary/20"
                    )}>
                      {item.table_name}
                    </span>
                  </div>

                    {/* Content Preview */}
                    {item.content && (
                      <p className={cn(
                        "text-xs sm:text-sm text-muted-foreground",
                        "line-clamp-2 leading-relaxed"
                      )}>
                        {item.title == 'site_id'
                          ? `${item.content}`
                          : item.content.split('_')[1]
                        }
                      </p>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
