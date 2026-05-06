const STATUS_LABELS = {
  enAttente: "en attente",
  enCours: "en cours",
  traitees: "traitees",
};

const CATEGORY_ALIASES = {
  "SERVICE CLIENT": ["service client", "client", "service", "service mtaa client", "service taa client"],
  "SINISTRE AUTO": ["sinistre auto", "auto", "voiture", "vehicule", "karhba", "karhabti", "tomobile"],
  "SINISTRE VIE": ["sinistre vie", "vie", "hyet", "hayet"],
  "SINISTRE IRDS": ["sinistre irds", "irds"],
  "NON CLASSEE": [
    "non classee",
    "non classe",
    "non classifiee",
    "sans categorie",
    "mahomch msanfin",
    "mouch msanfin",
    "mech msanfin",
    "bla categorie",
  ],
};

const CHANNEL_ALIASES = {
  facebook: ["facebook", "fb", "face"],
  email: ["email", "mail", "gmail"],
  telephone: ["telephone", "tel", "appel", "talfoun", "talifoun"],
  web: ["web", "site", "site web"],
};

const GENDER_ALIASES = {
  Femme: ["femme", "femmes", "female", "nsa", "nessa", "mra", "mara", "bnat"],
  Homme: ["homme", "hommes", "male", "rjel", "rajel", "dhkor", "wled"],
  Autre: ["autre", "autres", "inconnu", "inconnue", "unknown"],
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLabel(value = "") {
  return normalizeText(value).toUpperCase();
}

function includesAny(message, keywords) {
  return keywords.some((keyword) => message.includes(normalizeText(keyword)));
}

function getWords(message) {
  return normalizeText(message).split(" ").filter(Boolean);
}

function levenshteinDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);

  for (let j = 1; j <= b.length; j += 1) {
    rows[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }

  return rows[a.length][b.length];
}

function isCloseWord(word, target) {
  if (word === target || word.includes(target)) {
    return true;
  }

  if (word.length < 4 || target.length < 4) {
    return false;
  }

  const maxDistance = Math.max(word.length, target.length) >= 7 ? 2 : 1;
  return levenshteinDistance(word, target) <= maxDistance;
}

function hasSimilarWord(message, targets) {
  const words = getWords(message);
  const normalizedTargets = targets.map(normalizeText);

  return words.some((word) =>
    normalizedTargets.some((target) => isCloseWord(word, target))
  );
}

function matchesIntent(message, phrases, fuzzyWords = []) {
  return includesAny(message, phrases) || hasSimilarWord(message, fuzzyWords);
}

function wordsFromPhrases(phrases) {
  return phrases.flatMap((phrase) => getWords(phrase));
}

function formatCount(value) {
  return Number.isFinite(value) ? value : 0;
}

function getPercent(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function parseComplaintDate(dateString) {
  if (!dateString) return null;

  if (String(dateString).includes("/")) {
    const [datePart, timePart = "00:00:00"] = String(dateString).split(" ");
    const [day, month, year] = datePart.split("/");
    const parsed = new Date(`${year}-${month}-${day}T${timePart}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLast30DaysPeakResponse(complaints = []) {
  const counts = {};
  const now = new Date();
  const last30Days = new Date();
  last30Days.setDate(now.getDate() - 30);

  complaints.forEach((item) => {
    const date = parseComplaintDate(item.comment_date);
    if (!date || date < last30Days) return;

    const label = getLocalDateKey(date);
    counts[label] = (counts[label] || 0) + 1;
  });

  const evolutionData = Object.entries(counts)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!evolutionData.length) {
    return "Aucune reclamation enregistree durant les 30 derniers jours.";
  }

  const maxPoint = evolutionData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    evolutionData[0]
  );

  const formattedDate = parseComplaintDate(maxPoint.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });

  return `Le pic des 30 derniers jours est de ${maxPoint.value} reclamation(s), enregistre le ${formattedDate}.`;
}

function findCategory(message, categoryStats = []) {
  const knownCategory = Object.entries(CATEGORY_ALIASES).find(([, aliases]) =>
    matchesIntent(message, aliases, wordsFromPhrases(aliases))
  );

  if (knownCategory) {
    const [label] = knownCategory;
    return categoryStats.find((item) => normalizeLabel(item.label) === label);
  }

  return categoryStats.find((item) => message.includes(normalizeText(item.label)));
}

function findChannel(message, channelStats = []) {
  const knownChannel = Object.entries(CHANNEL_ALIASES).find(([, aliases]) =>
    matchesIntent(message, aliases, wordsFromPhrases(aliases))
  );

  if (knownChannel) {
    const [label] = knownChannel;
    const exactMatch = channelStats.find((item) => normalizeText(item.label) === label);
    if (exactMatch) return exactMatch;
  }

  return channelStats.find((item) => message.includes(normalizeText(item.label)));
}

function findGender(message, genderStats = []) {
  const knownGender = Object.entries(GENDER_ALIASES).find(([, aliases]) =>
    matchesIntent(message, aliases, wordsFromPhrases(aliases))
  );

  if (knownGender) {
    const [label] = knownGender;
    return genderStats.find((item) => normalizeLabel(item.label) === normalizeLabel(label));
  }

  return genderStats.find((item) => message.includes(normalizeText(item.label)));
}

function getTopItem(items = []) {
  return [...items]
    .filter((item) => formatCount(item.value) > 0)
    .sort((a, b) => formatCount(b.value) - formatCount(a.value))[0];
}

function getCategoryResponse(category, stats) {
  if (!category) {
    return "Je n'ai pas trouve cette categorie dans les donnees actuelles.";
  }

  const value = formatCount(category.value);
  const rate = getPercent(value, stats.total);

  return `${category.label} : ${value} reclamation(s), soit ${rate}% du total.`;
}

function getChannelResponse(channel, stats) {
  if (!channel) {
    return "Je n'ai pas trouve ce canal dans les donnees actuelles.";
  }

  const value = formatCount(channel.value);
  const rate = getPercent(value, stats.total);

  return `${channel.label} : ${value} reclamation(s), soit ${rate}% du total.`;
}

function getStatusResponse(statusKey, stats) {
  const value = formatCount(stats[statusKey]);
  const rate = getPercent(value, stats.total);

  return `Il y a ${value} reclamation(s) ${STATUS_LABELS[statusKey]}, soit ${rate}% du total.`;
}

function getGenderResponse(gender) {
  if (!gender) {
    return "Je n'ai pas trouve cette repartition dans les donnees actuelles.";
  }

  return `${gender.label} : ${formatCount(gender.value)} reclamation(s), soit ${formatCount(gender.percent)}% du total.`;
}

function getFeedbackResponse(feedbackStats, type = "positive") {
  if (!feedbackStats) {
    return "Les statistiques de feedback ne sont pas encore disponibles.";
  }

  const total = formatCount(feedbackStats.total);
  const positive = formatCount(feedbackStats.good_feedbacks);
  const negative = formatCount(feedbackStats.reclamations);

  if (type === "negative") {
    return `Feedbacks negatifs / reclamations : ${negative}, soit ${getPercent(negative, total)}% du total des feedbacks.`;
  }

  if (type === "summary") {
    return [
      "Feedbacks :",
      `- Positifs : ${positive} (${getPercent(positive, total)}%)`,
      `- Negatifs / reclamations : ${negative} (${getPercent(negative, total)}%)`,
      `- Total feedbacks : ${total}`,
    ].join("\n");
  }

  return `Good feedbacks / feedbacks positifs : ${positive}, soit ${getPercent(positive, total)}% du total des feedbacks.`;
}

function getComplaintFeedbackComparison(stats, feedbackStats) {
  if (!feedbackStats) {
    return "Les statistiques de feedback ne sont pas encore disponibles.";
  }

  const complaints = formatCount(stats.total);
  const totalFeedbacks = formatCount(feedbackStats.total);
  const goodFeedbacks = formatCount(feedbackStats.good_feedbacks);

  return [
    `Reclamations : ${complaints}, soit ${getPercent(complaints, totalFeedbacks)}% du total des feedbacks.`,
    `Feedbacks positifs : ${goodFeedbacks}, soit ${getPercent(goodFeedbacks, totalFeedbacks)}%.`,
    `Total feedbacks : ${totalFeedbacks}.`,
  ].join("\n");
}

function getUserResponse(userStats, type = "total") {
  if (!userStats) {
    return "Les statistiques des utilisateurs ne sont pas encore disponibles.";
  }

  const total = formatCount(userStats.total);
  const admins = formatCount(userStats.admins);
  const agents = formatCount(userStats.agents);
  const active = formatCount(userStats.active);

  if (type === "admins") {
    return `Il y a ${admins} admin(s) dans la plateforme.`;
  }

  if (type === "agents") {
    return `Il y a ${agents} agent(s) dans la plateforme.`;
  }

  if (type === "active") {
    return `Il y a ${active} utilisateur(s) actif(s) dans la plateforme.`;
  }

  return `Il y a ${total} utilisateur(s) dans la plateforme : ${admins} admin(s) et ${agents} agent(s).`;
}

function getAgencyResponse(agencyStats, message = "") {
    
  const total = formatCount(agencyStats?.total);

  if (!total) {
    return "Les statistiques des agences ne sont pas encore disponibles.";
  }

  if (matchesIntent(
    message,
    [
      "ou exactement",
      "ou sont les agences",
      "localisation agences",
      "emplacement agences",
      "adresse agences",
      "villes agences",
      "where are agencies",
      "where exactly",
      "win agences",
      "fin agences",
    ],
    ["localisation", "emplacement", "adresse", "villes", "where", "exactly", "win"]
  )) {
    const regions = agencyStats.regions || [];
    const cities = agencyStats.cities || [];

    if (regions.length) {
      return [
        `Les ${total} agences MAE sont reparties en Tunisie par zones :`,
        ...regions.map((item) => `- ${item.region} : ${item.count}`),
      ].join("\n");
    }

    if (cities.length) {
      return `Les agences sont presentes dans : ${cities.join(", ")}.`;
    }
  }

  return `MAE Assurances compte ${total} agence(s) en Tunisie.`;
}

function getAnalysisResponse(stats, categoryStats, channelStats) {
  const topCategory = getTopItem(categoryStats);
  const topChannel = getTopItem(channelStats);
  const waitingRate = getPercent(formatCount(stats.enAttente), stats.total);

  const alerts = [];

  if (waitingRate >= 50) {
    alerts.push("Le taux d'attente est eleve.");
  }

  if (formatCount(stats.total) === 0) {
    return "Aucune reclamation ne correspond aux filtres actuels.";
  }

  return [
    "Analyse rapide :",
    `- Total : ${formatCount(stats.total)} reclamation(s)`,
    `- En attente : ${formatCount(stats.enAttente)} (${waitingRate}%)`,
    `- En cours : ${formatCount(stats.enCours)}`,
    `- Traitees : ${formatCount(stats.traitees)}`,
    topCategory ? `- Categorie dominante : ${topCategory.label}` : "",
    topChannel ? `- Canal dominant : ${topChannel.label}` : "",
    alerts.length ? `- Alerte : ${alerts.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getBotResponse(
  message,
  {
    stats = {},
    categoryStats = [],
    channelStats = [],
    genderStats = [],
    feedbackStats = null,
    complaints = [],
    userStats = null,
    agencyStats = null,
  }
) {
  const msg = normalizeText(message);
  const safeStats = {
    total: formatCount(stats.total),
    enAttente: formatCount(stats.enAttente),
    enCours: formatCount(stats.enCours),
    traitees: formatCount(stats.traitees),
  };

  if (!msg) {
    return "Ecris une question sur les reclamations, les statuts, les categories ou les canaux.";
  }

  if (matchesIntent(msg, ["aide", "help", "quoi demander", "commandes"], ["aide", "help", "commande"])) {
    return [
      "Tu peux me demander par exemple :",
      "- total",
      "- combien de reclamations en attente",
      "- analyse",
      "- reclamations service client",
      "- reclamations par canal facebook",
      "- categorie dominante",
      "- canal dominant",
      "- pourcentage femmes",
      "- how many good feedbacks",
      "- good feedback percentage",
      "- pic des 30 derniers jours",
      "- combien d'utilisateurs",
      "- combien d'agences MAE",
      "- 9adech rjel",
      "- kadeh mn good feedbacks",
      "- chnowa total",
      "- 9adech en attente",
      "- aatini analyse",
    ].join("\n");
  }

  if (matchesIntent(msg, ["bonjour", "salut", "hello", "bonsoir", "salam", "ahla", "aslema", "3aslema"], ["bonjour", "salut", "salam", "aslema"])) {
    return "Bonjour ! Je peux t'aider a analyser les reclamations du tableau de bord.";
  }

  if (
    matchesIntent(
      msg,
      [
        "reclamations par rapport feedback",
        "reclamations par rapport aux feedbacks",
        "reclamation par rapport feedbacks",
        "reclamations vs feedbacks",
        "complaints vs feedbacks",
        "complaints compared to feedbacks",
        "reclamations compared to feedbacks",
        "rapport reclamations feedbacks",
      ],
      ["feedback", "feedbacks"]
    ) &&
    matchesIntent(
      msg,
      ["reclamation", "reclamations", "complaint", "complaints"],
      ["reclamation", "reclamations", "complaint", "complaints"]
    )
  ) {
    return getComplaintFeedbackComparison(safeStats, feedbackStats);
  }

  if (includesAny(msg, ["agence", "agences", "agency", "agencies"])) {
    return getAgencyResponse(agencyStats, msg);
  }

  if (matchesIntent(
    msg,
    [
      "combien d agences",
      "combien agences",
      "mae a combien d agences",
      "nombre agences",
      "agences mae",
      "mae agencies",
      "how many agencies",
      "how many mae agencies",
      "9adech agence",
      "9adech agences",
    ],
    []
  )) {
    return getAgencyResponse(agencyStats, msg);
  }

  if (matchesIntent(
    msg,
    [
      "combien d utilisateurs",
      "combien utilisateurs",
      "combien agents",
      "combien d agents",
      "nombre agents",
      "combien admins",
      "combien d admins",
      "nombre admins",
      "nombre utilisateurs",
      "utilisateurs dans cette plateforme",
      "utilisateurs plateforme",
      "users in platform",
      "how many users",
      "how many users in platform",
      "how many agents",
      "how many admins",
      "9adech utilisateur",
      "9adech users",
      "9adech agents",
      "9adech admins",
    ],
    ["utilisateur", "utilisateurs", "users", "admin", "admins", "agent", "agents"]
  )) {
    if (matchesIntent(msg, ["admin", "admins", "administrateur"], ["admin", "admins"])) {
      return getUserResponse(userStats, "admins");
    }

    if (matchesIntent(msg, ["agent", "agents"], ["agent", "agents"])) {
      return getUserResponse(userStats, "agents");
    }

    if (matchesIntent(msg, ["actif", "actifs", "active", "enabled"], ["actif", "active"])) {
      return getUserResponse(userStats, "active");
    }

    return getUserResponse(userStats, "total");
  }

  if (matchesIntent(
    msg,
    [
      "pic des 30 derniers jours",
      "pic dans les 30 derniers jours",
      "pic 30 jours",
      "peak last 30 days",
      "last 30 days peak",
      "highest day last 30 days",
      "akther nhar fi 30 jours",
      "akther nhar",
    ],
    ["pic", "peak"]
  )) {
    return getLast30DaysPeakResponse(complaints);
  }

  if (matchesIntent(
    msg,
    ["analyse", "resume", "synthese", "rapport", "fasarli", "fasserli", "aati analyse", "aatini analyse", "choufli"],
    ["analyse", "resume", "synthese", "rapport", "fasserli", "fasarli"]
  )) {
    return getAnalysisResponse(safeStats, categoryStats, channelStats);
  }

  if (includesAny(msg, ["categorie dominante", "top categorie", "plus grande categorie", "akther categorie", "akthar categorie", "categorie akther", "categorie akthar"])) {
    const topCategory = getTopItem(categoryStats);
    return topCategory
      ? `La categorie dominante est ${topCategory.label} avec ${topCategory.value} reclamation(s).`
      : "Aucune categorie dominante disponible.";
  }

  if (includesAny(msg, ["canal dominant", "top canal", "source dominante", "akther canal", "akthar canal", "akther source", "akthar source", "men win akther"])) {
    const topChannel = getTopItem(channelStats);
    return topChannel
      ? `Le canal dominant est ${topChannel.label} avec ${topChannel.value} reclamation(s).`
      : "Aucun canal dominant disponible.";
  }

  if (matchesIntent(
    msg,
    ["attente", "attentes", "en attente", "en attentes", "non traitee", "non traitees", "mazel", "mazelou", "mazelhom", "mestana", "mestanin", "yestanew", "yestana"],
    ["attente", "attentes", "atente", "atentes", "attante", "attantes", "attende", "mazel", "mestana", "yestana"]
  )) {
    return getStatusResponse("enAttente", safeStats);
  }

  if (matchesIntent(
    msg,
    ["en cours", "cours", "traitement", "yet3aljou", "yetaljou", "fel traitement", "fi traitement", "qed traitement"],
    ["yet3aljou", "yetaljou"]
  )) {
    return getStatusResponse("enCours", safeStats);
  }

  if (matchesIntent(
    msg,
    ["traite", "traitee", "traitees", "traiter", "terminee", "terminees", "cloturee", "tsal7ou", "tsalhou", "tkamlou", "kemlou", "t3aljou", "taaljou"],
    ["traite", "traitee", "traiter", "traites", "tratee", "trater", "terminee", "termine", "cloturee", "cloture", "tsal7ou", "tsalhou", "tkamlou", "kemlou"]
  )) {
    return getStatusResponse("traitees", safeStats);
  }

  if (matchesIntent(
    msg,
    [
      "bad feedback",
      "bad feedbacks",
      "negative feedback",
      "negative feedbacks",
      "feedback negatif",
      "feedbacks negatifs",
      "reclamations feedback",
      "bad reviews",
    ],
    ["negative", "negatif", "negatifs", "bad"]
  )) {
    return getFeedbackResponse(feedbackStats, "negative");
  }

  if (matchesIntent(
    msg,
    ["feedback summary", "feedbacks summary", "resume feedback", "resume feedbacks", "analyse feedback", "analyse feedbacks"],
    ["summary", "resume"]
  )) {
    return getFeedbackResponse(feedbackStats, "summary");
  }

  if (matchesIntent(
    msg,
    [
      "good feedback",
      "good feedbacks",
      "positive feedback",
      "positive feedbacks",
      "feedback positif",
      "feedbacks positifs",
      "avis positif",
      "avis positifs",
      "retour positif",
      "retours positifs",
      "feedback behi",
      "feedbacks behin",
      "good reviews",
    ],
    ["positive", "positif", "positifs", "behi", "behin"]
  )) {
    return getFeedbackResponse(feedbackStats, "positive");
  }

  if (matchesIntent(
    msg,
    ["feedback", "feedbacks", "reviews", "avis", "retours"],
    ["feedback", "feedbacks", "reviews", "avis"]
  )) {
    return getFeedbackResponse(feedbackStats, "summary");
  }

  const gender = findGender(msg, genderStats);
  if (gender) {
    return getGenderResponse(gender);
  }

  if (includesAny(msg, ["canal", "source", "facebook", "fb", "mail", "email", "telephone", "web", "men win", "mnin", "source mtaa"])) {
    return getChannelResponse(findChannel(msg, channelStats), safeStats);
  }

  const category = findCategory(msg, categoryStats);
  if (category) {
    return getCategoryResponse(category, safeStats);
  }

  if (matchesIntent(
    msg,
    ["total", "combien", "nombre", "tout", "9adech", "qadech", "kadech", "ch9adech", "chnowa total", "kol", "elkoll", "lkol"],
    ["total", "combien", "nombre", "9adech", "qadech", "kadech", "ch9adech"]
  )) {
    return `Total : ${safeStats.total} reclamation(s).`;
  }

  return "Je n'ai pas compris. Essaie : total, en attente, analyse, service client, sinistre auto, categorie dominante, canal dominant. En darija : 9adech en attente, aatini analyse, chnowa total.";
}
