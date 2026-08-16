import { useMemo, useState } from "react"

import { EventCard } from "@/components/events/event-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SAMPLE_EVENTS = [
  { title: "Festival de Verão", city: "Fortaleza", date: "20 dez", priceFrom: "R$ 80" },
  { title: "Noite de Jazz", city: "Fortaleza", date: "15 jan", priceFrom: "R$ 45" },
  { title: "Feira Gastronômica", city: "Fortaleza", date: "02 fev", priceFrom: "R$ 25" },
  { title: "Carnaval de Rua", city: "Recife", date: "08 fev", priceFrom: "R$ 60" },
  { title: "Encontro de Frevo", city: "Recife", date: "22 fev", priceFrom: "R$ 30" },
]

const CITIES = Array.from(new Set(SAMPLE_EVENTS.map((event) => event.city)))

export function HomePage() {
  const [city, setCity] = useState("all")

  const filteredEvents = useMemo(
    () =>
      city === "all"
        ? SAMPLE_EVENTS
        : SAMPLE_EVENTS.filter((event) => event.city === city),
    [city]
  )

  return (
    <div>
      <section className="relative overflow-hidden bg-sidebar">
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(circle_at_top,color-mix(in_oklch,var(--primary),transparent_82%),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="font-heading text-4xl font-semibold text-sidebar-foreground sm:text-5xl">
            Encontre o próximo evento na sua cidade
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sidebar-foreground/70">
            Ingressos para shows, festivais e experiências, direto de
            organizadores verificados.
          </p>

          <div className="mx-auto mt-8 max-w-xs">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue placeholder="Escolha uma cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {CITIES.map((cityOption) => (
                  <SelectItem key={cityOption} value={cityOption}>
                    {cityOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 font-heading text-lg font-medium">
          {city === "all" ? "Em destaque" : `Em destaque em ${city}`}
        </h2>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.title} {...event} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Nenhum evento em {city} ainda. Tente outra cidade.
          </p>
        )}
      </section>
    </div>
  )
}
