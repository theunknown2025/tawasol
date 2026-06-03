import type { Publication } from "@/hooks/usePublications";
import type { PublicationAnalysis } from "@/pages/admin/MURAI/types";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const MAX_COMMENTS_IN_PROMPT = 40;

interface OpenAIAnalysisPayload {
  summary: string;
  postReport: string;
  commentsSummary: string;
}

function getApiKey(): string {
  const key = (import.meta.env.VITE_OPENAI_API_KEY ?? "").toString().trim();
  if (!key) {
    throw new Error(
      "Clé OpenAI manquante. Ajoutez VITE_OPENAI_API_KEY dans votre fichier .env.local puis redémarrez le serveur de développement."
    );
  }
  return key;
}

function buildUserPrompt(pub: Publication): string {
  const commentsForPrompt = pub.comments.slice(0, MAX_COMMENTS_IN_PROMPT);
  const commentLines = commentsForPrompt
    .map((c) => `- ${c.author}: ${c.text}`)
    .join("\n");
  const truncatedNote =
    pub.comments.length > MAX_COMMENTS_IN_PROMPT
      ? `\n(${pub.comments.length - MAX_COMMENTS_IN_PROMPT} commentaire(s) supplémentaire(s) non listés)`
      : "";

  return [
    `Auteur: ${pub.authorName}`,
    `Date de publication: ${pub.publishedAt?.toISOString() ?? pub.createdAt.toISOString()}`,
    `Hashtags: ${(pub.tags ?? []).length > 0 ? (pub.tags ?? []).map((t) => `#${t}`).join(", ") : "(aucun)"}`,
    `Statistiques: ${pub.likes} likes, ${pub.comments.length} commentaire(s), ${pub.clicks} clics`,
    `Pièces jointes: ${pub.files.length} fichier(s)`,
    "",
    "Texte de la publication:",
    pub.text?.trim() || "(vide)",
    "",
    pub.comments.length > 0
      ? `Commentaires (${pub.comments.length} au total):\n${commentLines}${truncatedNote}`
      : "Commentaires: aucun",
  ].join("\n");
}

function parseOpenAIContent(content: string): OpenAIAnalysisPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Réponse OpenAI invalide (JSON attendu).");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Réponse OpenAI invalide.");
  }

  const o = parsed as Record<string, unknown>;
  const summary = String(o.summary ?? "").trim();
  const postReport = String(o.postReport ?? o.detailedReport ?? "").trim();
  const commentsSummary = String(o.commentsSummary ?? "").trim();

  if (!summary || !postReport) {
    throw new Error("Résumé ou rapport sur la publication manquant dans la réponse OpenAI.");
  }

  return {
    summary,
    postReport,
    commentsSummary:
      commentsSummary ||
      "Aucun commentaire sur cette publication.",
  };
}

function toPublicationAnalysis(pub: Publication, ai: OpenAIAnalysisPayload): PublicationAnalysis {
  const engagementTotal = pub.likes + pub.comments.length + pub.clicks;

  return {
    id: crypto.randomUUID(),
    publicationId: pub.id,
    generatedAt: new Date().toISOString(),
    summary: ai.summary,
    postReport: ai.postReport,
    commentsSummary: ai.commentsSummary,
    engagement: {
      likes: pub.likes,
      comments: pub.comments.length,
      clicks: pub.clicks,
      total: engagementTotal,
    },
    metrics: [
      { name: "Likes", value: pub.likes },
      { name: "Commentaires", value: pub.comments.length },
      { name: "Clics", value: pub.clicks },
    ],
  };
}

/** Génère un rapport sur une publication via l'API OpenAI (clé dans VITE_OPENAI_API_KEY). */
export async function analyzePublicationWithOpenAI(pub: Publication): Promise<PublicationAnalysis> {
  const apiKey = getApiKey();

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un assistant de rédaction pour REMESS, une plateforme associative.
À partir des données fournies, produis un RAPPORT INFORMATIF en français — pas une évaluation de qualité.

Règles strictes:
- Ne juge pas la qualité, la clarté, le ton ou l'efficacité de la publication.
- Ne donne aucune recommandation pour améliorer le contenu ou l'engagement.
- Ne calcule pas de score de sentiment ni d'appréciation.
- Reste factuel et neutre : résume ce qui est dit, les thèmes abordés et ce qui ressort des échanges.

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown) ayant exactement ces clés:
- "summary": vue d'ensemble en 2 à 4 phrases (publication + fil de commentaires s'il y en a)
- "postReport": rapport sur le contenu principal de la publication (sujet, informations clés, hashtags mentionnés si pertinents)
- "commentsSummary": synthèse des commentaires (points soulevés, questions, réactions récurrentes). Si aucun commentaire, indique-le clairement en une phrase.`,
        },
        {
          role: "user",
          content: buildUserPrompt(pub),
        },
      ],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let detail = raw.slice(0, 300);
    try {
      const errJson = JSON.parse(raw) as { error?: { message?: string } };
      detail = errJson.error?.message ?? detail;
    } catch {
      /* use raw slice */
    }
    throw new Error(`OpenAI (${res.status}): ${detail}`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new Error("Réponse OpenAI illisible.");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI n'a pas renvoyé de contenu d'analyse.");
  }

  const aiPayload = parseOpenAIContent(content);
  return toPublicationAnalysis(pub, aiPayload);
}
