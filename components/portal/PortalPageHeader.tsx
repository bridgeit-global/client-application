import * as React from "react"

import { PortalHeading } from "./PortalHeading"

export type PortalPageHeaderProps = {
  title: string
  description?: string
  as?: "h1" | "h2"
  actions?: React.ReactNode
  className?: string
}

export function PortalPageHeader({
  title,
  description,
  as = "h1",
  actions,
  className
}: PortalPageHeaderProps) {
  return (
    <div
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      ].filter(Boolean).join(" ")}
    >
      <PortalHeading
        title={title}
        description={description}
        as={as}
        className="min-w-0"
      />

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

