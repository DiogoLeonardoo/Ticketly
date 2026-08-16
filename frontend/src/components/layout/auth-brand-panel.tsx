interface AuthBrandPanelProps {
  heading: string
  description: string
}

export function AuthBrandPanel({ heading, description }: AuthBrandPanelProps) {
  return (
    <div className="relative hidden overflow-hidden bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="absolute inset-0 [background:radial-gradient(circle_at_75%_15%,color-mix(in_oklch,var(--sidebar-primary),transparent_75%),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-y-12 right-14 border-r-2 border-dashed border-sidebar-foreground/15"
      />

      <span className="relative font-heading text-lg font-semibold">
        Ticketly
      </span>

      <div className="relative max-w-xs">
        <p className="font-heading text-3xl leading-tight font-semibold">
          {heading}
        </p>
        <p className="mt-3 text-sm text-sidebar-foreground/70">
          {description}
        </p>
      </div>
    </div>
  )
}
