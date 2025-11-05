"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function BlogSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative flex w-full max-w-sm items-center space-x-2">
            <Input
                type="text"
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
            />
            <Button type="submit" size="sm">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
            </Button>
        </form>
    );
} 