import * as React from "react"

export type PortalHeadingProps = {
  title: string
  description?: string
  /**
   * Prefer `h1` for page titles and `h2` for section titles.
   * Most portal pages should use `h1` or a consistent `PortalPageHeader`.
   */
  as?: "h1" | "h2"
  className?: string
}

export function PortalHeading({
  title,
  description,
  as = "h1",
  className
}: PortalHeadingProps) {
  const HeadingTag = as

  return (
    <div className={className}>
      <HeadingTag className="text-2xl md:text-3xl font-semibold tracking-tight">
        {title}
      </HeadingTag>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

