"use client"

import * as React from "react"
import { FilterX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type PortalFilterSheetProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  primaryLabel: string
  onSubmit: (e: React.FormEvent) => void
  onClear?: () => void
  clearLabel?: string
  side?: "right" | "left" | "top" | "bottom"
  contentClassName?: string
}

export function PortalFilterSheet({
  trigger,
  children,
  primaryLabel,
  onSubmit,
  onClear,
  clearLabel = "Clear",
  side = "right",
  contentClassName
}: PortalFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side={side}
        className={cn("w-full sm:w-[400px]", contentClassName)}
      >
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-6">{children}</div>

          <div className="flex flex-col gap-2 mt-4 sticky bottom-0 py-4 bg-background border-t">
            <SheetClose asChild>
              <Button type="submit" className="w-full">
                {primaryLabel}
              </Button>
            </SheetClose>
            {onClear ? (
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="link"
                  className="w-full justify-start"
                  onClick={onClear}
                >
                  {clearLabel} <FilterX className="ml-2 h-4 w-4" />
                </Button>
              </SheetClose>
            ) : null}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

