import React from "react";
import { Shield, Lock, FileCheck, History, Globe, AlertTriangle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    id: "auth",
    icon: Lock,
    title: "Authentification académique (@uca.ac.ma)",
    content:
      "Seuls les utilisateurs disposant d'un compte académique valide de l'Université Cadi Ayyad peuvent accéder à la plateforme. Aucune inscription externe n'est autorisée.",
  },
  {
    id: "roles",
    icon: Shield,
    title: "Contrôle d'accès par rôles",
    content:
      "Chaque utilisateur dispose d'un rôle spécifique (candidat, administrateur, membre de commission, président) avec des permissions strictement définies. Principe du moindre privilège appliqué.",
  },
  {
    id: "audit",
    icon: History,
    title: "Journal d'audit (qui/quand/quoi)",
    content:
      "Toutes les actions sont enregistrées avec horodatage, identité de l'utilisateur et détails de l'opération. Le journal est immuable et consultable par les administrateurs autorisés.",
  },
  {
    id: "files",
    icon: FileCheck,
    title: "Téléversements sécurisés (PDF, accès contrôlé)",
    content:
      "Les documents sont stockés de manière sécurisée avec validation de format (PDF uniquement), analyse antivirus, et accès contrôlé selon le rôle et le statut du dossier.",
  },
  {
    id: "https",
    icon: Globe,
    title: "HTTPS uniquement",
    content:
      "Toutes les communications sont chiffrées via HTTPS avec certificat SSL/TLS. Aucune donnée ne transite en clair sur le réseau.",
  },
];

export function Security() {
  return (
    <section id="securite" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Sécurité & Confidentialité
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            La protection des données académiques et la confidentialité des
            évaluations sont au cœur de notre architecture.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Accordion */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="w-full">
              {securityFeatures.map((feature) => (
                <AccordionItem key={feature.id} value={feature.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <feature.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span>{feature.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-14">
                    {feature.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Security callout */}
          <div className="lg:col-span-1">
            <Card className="bg-foreground text-background border-0 h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="p-3 bg-background/10 rounded-lg w-fit mb-4">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Engagement Sécurité
                </h3>
                <p className="text-background/80 text-sm leading-relaxed flex-1">
                  La plateforme MCH→PES est conçue selon les meilleures pratiques
                  de sécurité informatique. Nous nous engageons à protéger vos
                  données personnelles et académiques conformément aux
                  réglementations en vigueur.
                </p>
                <div className="mt-6 pt-4 border-t border-background/20">
                  <div className="flex items-center gap-2 text-sm text-background/70">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Signaler un incident : security@uca.ac.ma</span>
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
