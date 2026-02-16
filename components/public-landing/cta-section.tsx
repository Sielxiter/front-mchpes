import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/public-landing/reveal"

export function CtaSection() {
  return (
    <section id="apply" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-background shadow-2xl sm:px-12 sm:py-20">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-background/[0.04] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-60 rounded-full bg-background/[0.03] blur-3xl" />

          <div className="relative mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à postuler ?
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-background/75">
                Lancez votre candidature dès maintenant. Préparez vos documents, suivez le
                workflow étape par étape, et soumettez votre dossier en toute sérénité.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-12 gap-2 rounded-xl px-7 text-[15px]"
                >
                  <a href="/login">
                    Commencer la candidature
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl border-background/20 bg-transparent px-7 text-[15px] text-background hover:bg-background/10 hover:text-background"
                >
                  <a href="#workflow">Revoir les étapes</a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
