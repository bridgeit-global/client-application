import React from 'react'
import { cn } from '@/lib/utils'
import Logo from '../logo'
import Link from 'next/link';

export function Footer() {
  const version = process.env.APP_VERSION || 'unknown'
  return (
    <footer className={cn(
      "sticky bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-300 ease-in-out",
      "shadow-lg shadow-black/5"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        "px-4 py-2 sm:px-6 lg:px-8",
        "min-h-[40px] sm:min-h-[45px]",
        "relative"
      )}>
        {/* Left Section - Copyright */}
        <div className={cn(
          "flex items-center space-x-2",
          "text-sm text-muted-foreground",
          "transition-all duration-200 ease-in-out"
        )}>
          <div className={cn(
            "flex items-center justify-center",
            "w-6 h-6 sm:w-7 sm:h-7",
            "transition-all duration-200 ease-in-out",
          )}>
            <Logo />
          </div>
          <span className="font-medium">
            {new Date().getFullYear()} BridgeIT
          </span>
          <span className="hidden sm:inline text-muted-foreground/70">
            • All rights reserved
          </span>
        </div>

        {/* Center Section - Additional Info */}
        <div className={cn(
          "hidden md:flex items-center space-x-4",
          "text-xs text-muted-foreground/70",
          "transition-all duration-200 ease-in-out"
        )}>
          <Link href="/privacy-policy" className="hover:text-muted-foreground transition-colors duration-200 cursor-pointer">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="/term-of-service" className="hover:text-muted-foreground transition-colors duration-200 cursor-pointer">
            Terms of Service
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="mailto:support@bridgeit.in" className="hover:text-muted-foreground transition-colors duration-200 cursor-pointer">
            Support
          </Link>
        </div>

        {/* Right Section - Version/Status */}
        <div className={cn(
          "flex items-center space-x-2",
          "text-xs text-muted-foreground/60",
          "transition-all duration-200 ease-in-out"
        )}>
          <div className="font-medium">
            v{version}
          </div>
        </div>
      </div>
      {/* Subtle gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-30 pointer-events-none" />
    </footer>
  )
}
