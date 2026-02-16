import React from "react";
import { GraduationCap, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 grid md:grid-cols-4 gap-8">
          {/* Logo & description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-8 w-8 text-background/80" />
              <span className="text-lg font-semibold">
                UCA | <span className="font-bold">MCH→PES</span>
              </span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed max-w-md">
              Plateforme de gestion des candidatures à la promotion du grade de
              Maître de Conférences vers Professeur de l’Enseignement Supérieur.
              Université Cadi Ayyad — ENSA Marrakech.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4 text-background">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#fonctionnalites"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#processus"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Processus
                </a>
              </li>
              <li>
                <a
                  href="#securite"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Sécurité
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-background">Informations</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Politique de confidentialité
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Mentions légales
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Conditions d’utilisation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.uca.ma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-1"
                >
                  Site UCA
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-background/20" />

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm text-center sm:text-left">
            © {currentYear} Université Cadi Ayyad — ENSA Marrakech. Tous droits
            réservés.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-background/60">Accès réservé</span>
            <span className="text-background font-mono">@uca.ac.ma</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
