import React from "react";
import {
  FileText,
  Shield,
  Users,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoginDialog } from "./Navbar";

export function Hero() {
  const scrollToSection = (href: string) => {
    const element = document.getElementById(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/40" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-muted/50 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-muted/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-muted/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Accès UCA
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Traçabilité
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Confidentialité
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Plateforme sécurisée de gestion des candidatures{" "}
                <span className="text-foreground underline underline-offset-4 decoration-border">
                  MCH → PES
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
                Dépôt, vérification et évaluation par commissions — 100%
                traçable et conforme aux exigences de l’Université Cadi Ayyad.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <LoginDialog />
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("processus")}
              >
                Consulter la procédure
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Accès réservé au personnel UCA (@uca.ac.ma)
              </p>
            </div>
          </div>

          {/* Right column - Stats card */}
          <div className="lg:pl-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-muted rounded-lg">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">
                      Vue d’ensemble de la plateforme
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <StatCard
                      icon={<FileText className="h-5 w-5" />}
                      label="Campagnes"
                      value="Actives"
                      description="Sessions de promotion"
                    />
                    <StatCard
                      icon={<Users className="h-5 w-5" />}
                      label="Spécialités"
                      value="Multiples"
                      description="Domaines couverts"
                    />
                    <StatCard
                      icon={<Shield className="h-5 w-5" />}
                      label="Commissions"
                      value="Dédiées"
                      description="Par spécialité"
                    />
                    <StatCard
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      label="Workflow"
                      value="Complet"
                      description="De A à Z"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-foreground/70 rounded-full animate-pulse" />
                      Système opérationnel et sécurisé
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
