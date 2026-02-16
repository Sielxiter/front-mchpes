import React from "react";
import {
  FileStack,
  History,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileStack,
    title: "Dématérialisation complète",
    description:
      "Soumission et gestion de tous les documents en ligne. Fini les dossiers papier et les déplacements inutiles.",
    color: "bg-muted text-foreground",
  },
  {
    icon: History,
    title: "Traçabilité & Audit",
    description:
      "Chaque action est horodatée et enregistrée. Journal d'audit complet pour une transparence totale.",
    color: "bg-muted text-foreground",
  },
  {
    icon: Users,
    title: "Collaboration sécurisée",
    description:
      "Les commissions évaluent les dossiers dans un espace dédié et confidentiel, avec accès contrôlé.",
    color: "bg-muted text-foreground",
  },
  {
    icon: ClipboardCheck,
    title: "Conformité administrative",
    description:
      "Processus aligné sur les règlements de l'Université Cadi Ayyad et les standards du ministère.",
    color: "bg-muted text-foreground",
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Pourquoi cette plateforme ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Une solution moderne et sécurisée pour simplifier et fiabiliser le
            processus de promotion des enseignants-chercheurs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border hover:shadow-lg transition-all duration-300 group bg-card"
            >
              <CardHeader className="pb-2">
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
