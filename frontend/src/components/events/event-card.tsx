import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface EventCardProps {
  title: string
  city: string
  date: string
  priceFrom: string
  imageUrl?: string
}

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]:hover"
const GROUP_HOVER = "[@media(hover:hover)_and_(pointer:fine)]:group-hover"

export function EventCard({ title, city, date, priceFrom, imageUrl }: EventCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden pt-0 transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        `${HOVER}:-translate-y-1 ${HOVER}:shadow-lg`
      )}
    >
      <div className="relative aspect-4/3 w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "size-full object-cover transition-transform duration-200 ease-out motion-reduce:transition-none",
              `${GROUP_HOVER}:scale-105`
            )}
          />
        ) : (
          <div
            aria-hidden
            className="size-full bg-linear-to-br from-primary via-primary/70 to-secondary-foreground"
          />
        )}
        <span className="absolute top-3 left-3 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
          {date}
        </span>
      </div>

      <CardContent className="pt-4">
        <h3 className="font-heading text-base leading-snug font-semibold">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{city}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          A partir de{" "}
          <span className="font-semibold text-foreground">{priceFrom}</span>
        </p>
      </CardContent>

      <CardFooter>
        <Button className="w-full">Comprar ingresso</Button>
      </CardFooter>
    </Card>
  )
}
