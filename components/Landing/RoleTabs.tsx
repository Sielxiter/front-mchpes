import React from "react";
import {
  User,
  Settings,
  Users,
  Crown,
  FileText,
  Upload,
  Eye,
  CheckCircle,
  BarChart,
  ClipboardList,
  UserCheck,
  FileSearch,
  Gavel,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const roles = [
  {
    id: "candidat",
    icon: User,
    label: "Candidat",
    description: "Enseignant-chercheur candidat à la promotion",
    features: [
      { icon: Upload, title: "Soumettre dossier", desc: "Dépôt en ligne du dossier complet" },
      { icon: FileText, title: "Suivre candidature", desc: "État d'avancement en temps réel" },
      { icon: Eye, title: "Consulter décisions", desc: "Accès aux résultats finaux" },
      { icon: MessageSquare, title: "Recevoir notifications", desc: "Alertes à chaque étape" },
    ],
  },
  {
    id: "admin",
    icon: Settings,
    label: "Administration",
    description: "Gestionnaire administratif de la plateforme",
    features: [
      { icon: ClipboardList, title: "Vérifier dossiers", desc: "Contrôle de conformité" },
      { icon: UserCheck, title: "Valider éligibilité", desc: "Critères administratifs" },
      { icon: Users, title: "Gérer commissions", desc: "Affectation des membres" },
      { icon: BarChart, title: "Statistiques", desc: "Tableaux de bord complets" },
    ],
  },
  {
    id: "commission",
    icon: Users,
    label: "Commission",
    description: "Membre évaluateur de la commission scientifique",
    features: [
      { icon: FileSearch, title: "Consulter dossiers", desc: "Accès aux documents candidats" },
      { icon: CheckCircle, title: "Évaluer candidatures", desc: "Notation et avis motivé" },
      { icon: MessageSquare, title: "Délibérer", desc: "Échanges en commission" },
      { icon: Gavel, title: "Voter décisions", desc: "Participation aux votes" },
    ],
  },
  {
    id: "president",
    icon: Crown,
    label: "Président",
    description: "Président de la commission ou instance de validation",
    features: [
      { icon: Eye, title: "Superviser processus", desc: "Vue globale de la campagne" },
      { icon: CheckCircle, title: "Valider décisions", desc: "Approbation finale" },
      { icon: BarChart, title: "Rapports détaillés", desc: "Synthèses et exports" },
      { icon: Settings, title: "Paramétrer campagne", desc: "Configuration avancée" },
    ],
  },
];

export function RoleTabs() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Un espace dédié pour chaque rôle
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez les fonctionnalités disponibles selon votre profil au sein
            de l’université.
          </p>
        </div>

        <Tabs defaultValue="candidat" className="w-full">
          <TabsList className="w-full flex flex-wrap justify-center gap-2 bg-transparent h-auto p-0 mb-8">
            {roles.map((role) => (
              <TabsTrigger
                key={role.id}
                value={role.id}
                className="data-[state=active]:bg-foreground data-[state=active]:text-background bg-background border border-border px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-muted transition-colors"
              >
                <role.icon className="h-4 w-4" />
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((role) => (
            <TabsContent key={role.id} value={role.id}>
              <Card className="border-border bg-card">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                    <div className="p-3 bg-muted rounded-lg">
                      <role.icon className="h-8 w-8 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Espace {role.label}
                      </h3>
                      <p className="text-muted-foreground">{role.description}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {role.features.map((feature, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/30 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="p-2 bg-background rounded-lg w-fit mb-3 group-hover:bg-background/80 transition-colors">
                          <feature.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
