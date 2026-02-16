import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "acces",
    question: "Qui peut accéder à la plateforme ?",
    answer:
      "L'accès est strictement réservé au personnel de l'Université Cadi Ayyad disposant d'un compte académique @uca.ac.ma valide. Les candidats doivent être des enseignants-chercheurs au grade de Maître de Conférences (MCH) souhaitant postuler pour le grade de Professeur de l'Enseignement Supérieur (PES).",
  },
  {
    id: "documents",
    question: "Quels documents sont requis pour le dossier ?",
    answer:
      "Le dossier complet comprend généralement : CV actualisé, liste des publications, rapports d'activités pédagogiques, attestations de service, diplômes, et tout document justificatif requis par le règlement en vigueur. La liste exacte est détaillée lors de chaque campagne et peut varier selon les spécialités.",
  },
  {
    id: "modification",
    question: "Puis-je modifier mon dossier après soumission ?",
    answer:
      "Une fois le dossier soumis, les modifications ne sont plus possibles directement. Toutefois, pendant la phase de vérification administrative, l'administration peut vous demander des compléments ou corrections via la plateforme. Vous recevrez une notification par email pour toute demande.",
  },
  {
    id: "commissions",
    question: "Comment sont gérées les commissions ?",
    answer:
      "Les commissions sont constituées par l'administration selon les spécialités des candidats. Chaque commission comprend des experts du domaine concerné. Les membres évaluent les dossiers de manière indépendante avant la délibération collective. Le président de commission valide les décisions finales.",
  },
  {
    id: "confidentialite",
    question: "Qui voit mes documents ?",
    answer:
      "Vos documents sont accessibles uniquement aux personnes autorisées selon leur rôle : l'administration pour la vérification, les membres de la commission assignée à votre spécialité pour l'évaluation, et le président pour la validation. Aucun accès externe n'est possible. Toutes les consultations sont tracées dans le journal d'audit.",
  },
  {
    id: "delais",
    question: "Quels sont les délais de traitement ?",
    answer:
      "Les délais dépendent de la campagne en cours et sont communiqués au début de chaque session. En général, comptez 2-3 semaines pour la vérification administrative, puis 4-6 semaines pour l'évaluation par les commissions. Les résultats sont publiés selon le calendrier officiel de l'université.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-muted rounded-lg mb-4">
            <HelpCircle className="h-8 w-8 text-foreground" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez les réponses aux questions les plus courantes concernant la
            plateforme et le processus de candidature.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left font-medium text-foreground">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
