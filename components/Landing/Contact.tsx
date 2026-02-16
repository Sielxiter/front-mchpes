import React from "react";
import { Mail, Phone, Clock, MapPin, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Contact() {
  return (
    <section id="contact" className="py-20 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Besoin d’aide ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre équipe de support est à votre disposition pour vous accompagner
            dans l’utilisation de la plateforme.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Support technique */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Headphones className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    Support Technique DSI
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Pour les problèmes techniques, questions sur l’accès ou
                    difficultés d’utilisation de la plateforme.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>support-mchpes@uca.ac.ma</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>+212 5 24 43 XX XX</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Administration */}
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <MapPin className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    Administration RH
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Pour les questions relatives à la procédure de promotion,
                    critères d’éligibilité et règlements.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>rh-enseignants@uca.ac.ma</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Lun-Ven : 8h30 - 16h30</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
