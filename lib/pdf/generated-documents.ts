export type SimpleUser = { name: string; email: string }

type Rgb = [number, number, number]

type ProfileLike = {
  nom?: string
  prenom?: string
  email?: string
  date_naissance?: string
  etablissement?: string
  ville?: string
  departement?: string
  grade_actuel?: string
  date_recrutement_es?: string
  date_recrutement_fp?: string | null
  numero_som?: string | null
  telephone?: string
  specialite?: string
}

type EnseignementLike = {
  annee_universitaire: string
  intitule: string
  type_enseignement: string
  type_module: string
  niveau: string
  volume_horaire: number
  equivalent_tp: number
}

type PfeLike = {
  annee_universitaire: string
  intitule: string
  niveau: string
  volume_horaire: number
}

type ActiviteLike = {
  category: string
  subcategory: string
  count: number
}

function normalizeDate(value: string | null | undefined): string {
  if (!value) return ""
  return value.length >= 10 ? value.slice(0, 10) : value
}

function nowFr(): string {
  try {
    return new Date().toLocaleString("fr-FR")
  } catch {
    return new Date().toISOString()
  }
}

async function createPdf(): Promise<any> {
  const mod = await import("jspdf")
  const jsPDF = (mod as any).jsPDF
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  return doc
}

// =============================================================================
// UCA academic template (minimal, official)
// =============================================================================

const PAGE = { w: 595.28, h: 841.89 } // A4 in points
const MARGIN = { l: 48, r: 48, t: 48, b: 56 }

// Subtle institutional palette (derived from logo tone; keep minimal)
const COLOR = {
  primary: [150, 86, 36] as Rgb, // warm brown/orange
  text: [25, 25, 25] as Rgb,
  muted: [95, 95, 95] as Rgb,
  line: [215, 215, 215] as Rgb,
  panel: [248, 246, 243] as Rgb,
}

let cachedLogoDataUrl: string | null = null

async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl !== null) return cachedLogoDataUrl
  try {
    const res = await fetch("/uca-logo.png", { cache: "force-cache" })
    if (!res.ok) {
      cachedLogoDataUrl = null
      return null
    }
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error("Failed to read logo"))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })
    cachedLogoDataUrl = dataUrl
    return dataUrl
  } catch {
    cachedLogoDataUrl = null
    return null
  }
}

function setColor(doc: any, rgb: Rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawHLine(doc: any, y: number) {
  doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2])
  doc.setLineWidth(0.8)
  doc.line(MARGIN.l, y, PAGE.w - MARGIN.r, y)
}

function wrapText(doc: any, text: string, maxWidth: number): string[] {
  const safe = text ?? ""
  return doc.splitTextToSize(safe, maxWidth)
}

function ensureSpace(doc: any, y: number, needed: number, headerTopY: number): number {
  const bottomLimit = PAGE.h - MARGIN.b
  if (y + needed <= bottomLimit) return y
  doc.addPage()
  return headerTopY
}

async function drawHeader(doc: any, opts: { title: string; subtitle?: string; docRef?: string }) {
  const logo = await loadLogoDataUrl()

  // Header band
  doc.setFillColor(COLOR.panel[0], COLOR.panel[1], COLOR.panel[2])
  doc.rect(0, 0, PAGE.w, 110, "F")

  // Logo
  if (logo) {
    try {
      // Keep logo small and institutional
      doc.addImage(logo, "PNG", MARGIN.l, 22, 56, 56)
    } catch {
      // ignore and fall back to text-only header
    }
  }

  // University title block
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  setColor(doc, COLOR.text)
  const headerX = logo ? MARGIN.l + 72 : MARGIN.l
  doc.text("Université Cadi Ayyad", headerX, 40)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setColor(doc, COLOR.muted)
  doc.text("UCA — Document officiel", headerX, 56)

  // Right-side meta
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setColor(doc, COLOR.muted)
  const meta = [
    opts.docRef ? `Réf: ${opts.docRef}` : null,
    `Date: ${nowFr()}`,
  ].filter(Boolean) as string[]
  meta.forEach((line, idx) => {
    const w = doc.getTextWidth(line)
    doc.text(line, PAGE.w - MARGIN.r - w, 40 + idx * 14)
  })

  // Document title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  setColor(doc, COLOR.primary)
  doc.text(opts.title, MARGIN.l, 98)

  if (opts.subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    setColor(doc, COLOR.text)
    doc.text(opts.subtitle, MARGIN.l, 116)
  }

  drawHLine(doc, 126)
}

function drawFooter(doc: any) {
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    const y = PAGE.h - 26
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    setColor(doc, COLOR.muted)
    drawHLine(doc, PAGE.h - 38)
    doc.text("Université Cadi Ayyad — Dossier de candidature", MARGIN.l, y)
    const pageLabel = `Page ${p}/${total}`
    const w = doc.getTextWidth(pageLabel)
    doc.text(pageLabel, PAGE.w - MARGIN.r - w, y)
  }
}

function sectionTitle(doc: any, title: string, y: number): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  setColor(doc, COLOR.text)
  doc.text(title, MARGIN.l, y)
  doc.setDrawColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2])
  doc.setLineWidth(1.4)
  doc.line(MARGIN.l, y + 6, MARGIN.l + 36, y + 6)
  return y + 18
}

function keyValueGrid(doc: any, items: Array<{ k: string; v: string }>, y: number): number {
  const colGap = 22
  const colW = (PAGE.w - MARGIN.l - MARGIN.r - colGap) / 2
  const leftX = MARGIN.l
  const rightX = MARGIN.l + colW + colGap

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setColor(doc, COLOR.text)

  let i = 0
  while (i < items.length) {
    y = ensureSpace(doc, y, 18, 140)
    const left = items[i]
    const right = items[i + 1]
    if (left) {
      doc.setFont("helvetica", "bold")
      doc.text(left.k, leftX, y)
      doc.setFont("helvetica", "normal")
      doc.text(left.v || "", leftX, y + 12)
    }
    if (right) {
      doc.setFont("helvetica", "bold")
      doc.text(right.k, rightX, y)
      doc.setFont("helvetica", "normal")
      doc.text(right.v || "", rightX, y + 12)
    }
    y += 28
    i += 2
  }
  return y
}

function paragraph(doc: any, text: string, y: number): number {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, COLOR.text)
  const lines = wrapText(doc, text, PAGE.w - MARGIN.l - MARGIN.r)
  y = ensureSpace(doc, y, lines.length * 14 + 6, 140)
  doc.text(lines, MARGIN.l, y)
  return y + lines.length * 14 + 6
}

function simpleTable(
  doc: any,
  cols: Array<{ label: string; w: number; align?: "left" | "right" }>,
  rows: string[][],
  y: number
): number {
  const x0 = MARGIN.l
  const rowH = 16
  const headerH = 18
  const tableW = cols.reduce((s, c) => s + c.w, 0)

  y = ensureSpace(doc, y, headerH + rowH * Math.min(rows.length, 2) + 10, 140)

  // Header background
  doc.setFillColor(COLOR.panel[0], COLOR.panel[1], COLOR.panel[2])
  doc.rect(x0, y - 12, tableW, headerH, "F")
  doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2])
  doc.rect(x0, y - 12, tableW, headerH)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  setColor(doc, COLOR.text)
  let x = x0
  cols.forEach((c) => {
    doc.text(c.label, x + 4, y)
    x += c.w
  })
  y += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  for (let r = 0; r < rows.length; r++) {
    y = ensureSpace(doc, y, rowH + 8, 140)
    const isAlt = r % 2 === 0
    if (isAlt) {
      doc.setFillColor(255, 255, 255)
    } else {
      doc.setFillColor(252, 252, 252)
    }
    doc.rect(x0, y - 10, tableW, rowH, "F")
    doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2])
    doc.rect(x0, y - 10, tableW, rowH)

    x = x0
    const row = rows[r]
    for (let c = 0; c < cols.length; c++) {
      const cell = String(row[c] ?? "")
      const col = cols[c]
      const maxW = col.w - 8
      const clipped = cell.length > 60 ? cell.slice(0, 57) + "…" : cell
      if (col.align === "right") {
        const w = doc.getTextWidth(clipped)
        doc.text(clipped, x + col.w - 4 - Math.min(w, maxW), y)
      } else {
        doc.text(clipped, x + 4, y)
      }
      x += col.w
    }
    y += rowH
  }

  return y + 10
}

export async function generateProfilePdf(params: {
  profile: ProfileLike | null
  user: SimpleUser
}): Promise<Blob> {
  const doc = await createPdf()
  await drawHeader(doc, {
    title: "Formulaire de demande de candidature",
    subtitle: "Dossier de candidature — Informations du candidat",
  })

  let y = 150
  const p = params.profile ?? {}

  y = sectionTitle(doc, "Identité", y)
  y = keyValueGrid(
    doc,
    [
      { k: "Nom", v: p.nom ?? "" },
      { k: "Prénom", v: p.prenom ?? "" },
      { k: "Email", v: p.email ?? params.user.email ?? "" },
      { k: "Date de naissance", v: normalizeDate(p.date_naissance) },
    ],
    y
  )

  y = sectionTitle(doc, "Affectation", y)
  y = keyValueGrid(
    doc,
    [
      { k: "Établissement", v: p.etablissement ?? "" },
      { k: "Ville", v: p.ville ?? "" },
      { k: "Département", v: p.departement ?? "" },
      { k: "Grade actuel", v: p.grade_actuel ?? "" },
      { k: "Date recrutement (ES)", v: normalizeDate(p.date_recrutement_es) },
      { k: "Date recrutement (FP)", v: normalizeDate(p.date_recrutement_fp ?? "") },
    ],
    y
  )

  y = sectionTitle(doc, "Coordonnées", y)
  y = keyValueGrid(
    doc,
    [
      { k: "Numéro SOM", v: p.numero_som ?? "" },
      { k: "Téléphone", v: p.telephone ?? "" },
      { k: "Spécialité", v: p.specialite ?? "" },
    ],
    y
  )

  y = ensureSpace(doc, y, 120, 140)
  y = sectionTitle(doc, "Déclaration", y)
  y = paragraph(
    doc,
    "Je certifie sur l'honneur l'exactitude de toutes les informations fournies dans ce dossier de candidature.",
    y
  )

  y += 10
  y = sectionTitle(doc, "Signatures", y)
  y = ensureSpace(doc, y, 80, 140)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, COLOR.text)
  doc.text("Fait à: ____________________", MARGIN.l, y)
  doc.text(`Le: ${normalizeDate(new Date().toISOString())}`, PAGE.w - MARGIN.r - 140, y)
  y += 32
  doc.text("Signature du candidat:", MARGIN.l, y)
  doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2])
  doc.setLineWidth(1)
  doc.line(MARGIN.l + 130, y, PAGE.w - MARGIN.r, y)

  drawFooter(doc)
  return doc.output("blob")
}

export async function generateEnseignementsPdf(params: {
  enseignements: EnseignementLike[]
  totals?: { volume_horaire?: number; equivalent_tp?: number }
}): Promise<Blob> {
  const doc = await createPdf()
  await drawHeader(doc, {
    title: "Récapitulatif des enseignements",
    subtitle: "Synthèse des responsabilités pédagogiques déclarées",
  })

  let y = 150
  const totalH = params.totals?.volume_horaire ?? params.enseignements.reduce((s, e) => s + Number(e.volume_horaire ?? 0), 0)
  const totalEq = params.totals?.equivalent_tp ?? params.enseignements.reduce((s, e) => s + Number(e.equivalent_tp ?? 0), 0)

  y = sectionTitle(doc, "Résumé", y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, COLOR.text)
  doc.text(`Nombre d'enseignements: ${params.enseignements.length}`, MARGIN.l, y)
  doc.text(`Total volume horaire: ${totalH}h`, MARGIN.l + 220, y)
  doc.text(`Total équivalent TP: ${Number(totalEq).toFixed(2)}h`, MARGIN.l + 410, y)
  y += 22

  y = sectionTitle(doc, "Détails", y)

  const rows = params.enseignements
    .slice()
    .sort((a, b) => String(b.annee_universitaire).localeCompare(String(a.annee_universitaire)))
    .map((e) => [
      String(e.annee_universitaire ?? ""),
      String(e.intitule ?? ""),
      String(e.type_enseignement ?? ""),
      String(Number(e.volume_horaire ?? 0)),
      String(Number(e.equivalent_tp ?? 0).toFixed(2)),
    ])

  y = simpleTable(
    doc,
    [
      { label: "Année", w: 72 },
      { label: "Intitulé", w: 300 },
      { label: "Type", w: 48 },
      { label: "Vol.", w: 52, align: "right" },
      { label: "Eq.TP", w: 60, align: "right" },
    ],
    rows,
    y
  )

  drawFooter(doc)
  return doc.output("blob")
}

export async function generatePfePdf(params: {
  pfes: PfeLike[]
  totals?: { volume_horaire?: number; count?: number }
}): Promise<Blob> {
  const doc = await createPdf()
  await drawHeader(doc, {
    title: "Récapitulatif des PFE encadrés",
    subtitle: "Encadrement pédagogique — Projets de fin d'études",
  })

  let y = 150
  const totalH = params.totals?.volume_horaire ?? params.pfes.reduce((s, p) => s + Number(p.volume_horaire ?? 0), 0)
  const totalCount = params.totals?.count ?? params.pfes.length

  y = sectionTitle(doc, "Résumé", y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, COLOR.text)
  doc.text(`Nombre de PFE: ${totalCount}`, MARGIN.l, y)
  doc.text(`Total volume horaire: ${totalH}h`, MARGIN.l + 220, y)
  y += 22

  y = sectionTitle(doc, "Détails", y)

  const rows = params.pfes
    .slice()
    .sort((a, b) => String(b.annee_universitaire).localeCompare(String(a.annee_universitaire)))
    .map((p) => [
      String(p.annee_universitaire ?? ""),
      String(p.intitule ?? ""),
      String(p.niveau ?? ""),
      String(Number(p.volume_horaire ?? 0)),
    ])

  y = simpleTable(
    doc,
    [
      { label: "Année", w: 72 },
      { label: "Intitulé", w: 330 },
      { label: "Niveau", w: 88 },
      { label: "Vol.", w: 42, align: "right" },
    ],
    rows,
    y
  )

  drawFooter(doc)
  return doc.output("blob")
}

export async function generateActivitesAttestationPdf(params: {
  title: string
  activites: ActiviteLike[]
}): Promise<Blob> {
  const doc = await createPdf()
  await drawHeader(doc, {
    title: params.title,
    subtitle: "Attestation — Déclaration sur l'honneur",
  })

  let y = 150
  y = sectionTitle(doc, "Déclaration", y)
  y = paragraph(
    doc,
    "Je soussigné(e) certifie sur l'honneur l'exactitude des activités déclarées ci-dessous. Ce document est établi pour servir et valoir ce que de droit.",
    y
  )

  y = sectionTitle(doc, "Activités déclarées", y)
  const rows = params.activites.map((a) => [
    String(a.category ?? ""),
    String(a.subcategory ?? ""),
    String(Number(a.count ?? 0)),
  ])

  y = simpleTable(
    doc,
    [
      { label: "Catégorie", w: 80 },
      { label: "Sous-catégorie", w: 350 },
      { label: "Nombre", w: 69, align: "right" },
    ],
    rows,
    y
  )

  y = ensureSpace(doc, y, 100, 140)
  y = sectionTitle(doc, "Signatures", y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  setColor(doc, COLOR.text)
  doc.text("Fait à: ____________________", MARGIN.l, y)
  doc.text(`Le: ${normalizeDate(new Date().toISOString())}`, PAGE.w - MARGIN.r - 140, y)
  y += 32
  doc.text("Signature du candidat:", MARGIN.l, y)
  doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2])
  doc.setLineWidth(1)
  doc.line(MARGIN.l + 130, y, PAGE.w - MARGIN.r, y)

  drawFooter(doc)
  return doc.output("blob")
}
