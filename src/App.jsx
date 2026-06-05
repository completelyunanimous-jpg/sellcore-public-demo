import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const BLOCK_VERSION = "Foundation 11 â€” Save Everything + Media Continuity";
const CANONICAL_KEY = "sellcore_optimization_foundation_11_memory";
const UI_STATE_KEY = "sellcore_optimization_foundation_11_ui_state";
const DRAFT_STATE_KEY = "sellcore_optimization_foundation_11_drafts";
const LAST_SAVE_KEY = "sellcore_optimization_foundation_11_last_full_save";
const LEGACY_KEY_HINTS = ["sellcore", "corecard", "foundation", "listing", "offer"];

const emptyListing = {
  title: "",
  category: "Daily Goods",
  condition: "Good",
  location: "Local pickup",
  price: "",
  note: "",
  tradeOpen: true,
  imageData: "",
  imageName: "",
  imageAlt: "",
};

const emptyOffer = {
  type: "Buy Offer",
  amount: "",
  tradeItem: "",
  message: "",
};

const SELLER_BOX_TYPES = ["Basic Box", "Street Box", "Digital Box", "Pickup Box", "Shipping Box"];

const defaultDiscovery = {
  search: "",
  category: "All",
  condition: "All",
  status: "All",
  trade: "All",
  saved: "All",
  deal: "All",
  sort: "Newest first",
  actionFilter: "All",
};

const defaultAutomation = {
  enabled: true,
  lastRunAt: null,
  rules: {
    savedCoreCardSignals: true,
    interestTracking: true,
    negotiationStatus: true,
    sellerBoxPreparation: true,
    verifiedValueUpdates: true,
    memoryProtectionEvents: true,
    actionSuggestions: true,
  },
  events: [],
};

const defaultProfile = {
  id: "persona-default",
  displayName: "SellCore Builder",
  personaTitle: "Daily Goods Operator",
  localZone: "Local marketplace",
  sellerStyle: "Fast, fair, trust-first deals",
  trustNote: "Real people. Real goods. Real value.",
  preferredDeal: "Pickup / local trade",
  badge: "Core Verified Prototype",
  motto: "List it fast. Build trust. Close clean.",
  avatarData: "",
  avatarName: "",
  bannerData: "",
  bannerName: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const emptyPersonaDraft = {
  displayName: "",
  personaTitle: "",
  localZone: "",
  sellerStyle: "",
  trustNote: "",
  preferredDeal: "",
  badge: "",
  motto: "",
  avatarData: "",
  avatarName: "",
  bannerData: "",
  bannerName: "",
};

const BOTTOM_NAV = [
  { id: "feed", icon: "âŒ‚", label: "Feed" },
  { id: "create", icon: "+", label: "Create" },
  { id: "market", icon: "âŒ•", label: "Market" },
  { id: "profiles", icon: "â—‰", label: "Profiles" },
  { id: "history", icon: "â‰¡", label: "History" },
  { id: "utilities", icon: "âš™", label: "Utilities" },
];

const MARKET_FILTER_ACTIONS = [
  "All",
  "Saved",
  "Trade Open",
  "Available",
  "Negotiating",
  "Completed",
  "Seller Box Requested",
];

const MESSAGE_BOARD_OUTLINE = [
  "Inbox shell for buyer and seller threads",
  "Conversation list tied to listings and Core profiles",
  "Private thread view for one deal at a time",
  "Offer-linked messages with Seller Box context",
  "Trust and safety notice before sharing pickup details",
  "No live sync yet until profile and feed media output are locked",
];

const demoListings = [
  {
    id: "listing-demo-1",
    title: "Solid wood TV stand",
    category: "Furniture",
    condition: "Good",
    location: "Baltimore / local pickup",
    price: "45",
    note: "Daily goods listing sample. Strong enough for a real buyer trust test.",
    tradeOpen: true,
    status: "Available",
    interestCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "listing-demo-2",
    title: "Compact desk chair",
    category: "Home",
    condition: "Fair",
    location: "Meetup available",
    price: "25",
    note: "Starter CoreCard for testing saves, offers, and Seller Box requests.",
    tradeOpen: false,
    status: "Available",
    interestCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialMemory = {
  version: BLOCK_VERSION,
  listings: demoListings,
  offers: [],
  savedIds: [],
  interestedSignals: [],
  sellerBoxRequests: [],
  selectedListingId: "listing-demo-1",
  actions: [],
  automation: defaultAutomation,
  profile: defaultProfile,
  personas: [defaultProfile],
  messageBoardOutline: MESSAGE_BOARD_OUTLINE,
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function storageRead(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  const parsed = safeParse(localStorage.getItem(key));
  return parsed && typeof parsed === "object" ? parsed : fallback;
}

function normalizeUiState(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    activeScreen: source.activeScreen || "feed",
    showSavedOnly: Boolean(source.showSavedOnly),
    sellerBoxType: source.sellerBoxType || SELLER_BOX_TYPES[0],
    discovery: { ...defaultDiscovery, ...(source.discovery || {}) },
    historyFilter: source.historyFilter || "All",
  };
}

function normalizeDrafts(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    listingDraft: { ...emptyListing, ...(source.listingDraft || {}) },
    offerDraft: { ...emptyOffer, ...(source.offerDraft || {}) },
    profileDraft: { ...emptyPersonaDraft, ...(source.profileDraft || {}) },
  };
}

function loadUiState() {
  return normalizeUiState(storageRead(UI_STATE_KEY, {}));
}

function loadDraftState() {
  return normalizeDrafts(storageRead(DRAFT_STATE_KEY, {}));
}

function estimateLocalStorageBytes() {
  if (typeof localStorage === "undefined") return 0;
  let total = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    const value = localStorage.getItem(key) || "";
    if (key.toLowerCase().includes("sellcore")) total += key.length + value.length;
  }
  return total * 2;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniq(list) {
  return Array.from(new Set(asArray(list).filter(Boolean)));
}

function normalizePersona(item, index = 0) {
  const source = item && typeof item === "object" ? item : {};
  return {
    id: source.id || `persona-${index}`,
    displayName: source.displayName || source.name || defaultProfile.displayName,
    personaTitle: source.personaTitle || source.title || defaultProfile.personaTitle,
    localZone: source.localZone || source.location || defaultProfile.localZone,
    sellerStyle: source.sellerStyle || source.style || defaultProfile.sellerStyle,
    trustNote: source.trustNote || source.note || defaultProfile.trustNote,
    preferredDeal: source.preferredDeal || source.dealPreference || defaultProfile.preferredDeal,
    badge: source.badge || defaultProfile.badge,
    motto: source.motto || defaultProfile.motto,
    avatarData: source.avatarData || source.profileImage || source.profilePicture || "",
    avatarName: source.avatarName || source.profileImageName || "",
    bannerData: source.bannerData || source.coverImage || "",
    bannerName: source.bannerName || source.coverImageName || "",
    createdAt: source.createdAt || nowIso(),
    updatedAt: source.updatedAt || source.createdAt || nowIso(),
  };
}

function normalizeMemory(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const automationSource = source.automation && typeof source.automation === "object" ? source.automation : {};

  const listings = asArray(source.listings || source.coreCards || source.cards).map((item, index) => ({
    id: item.id || item.listingId || `listing-migrated-${index}`,
    title: item.title || item.name || "Untitled CoreCard",
    category: item.category || "Daily Goods",
    condition: item.condition || "Used",
    location: item.location || "Local",
    price: String(item.price ?? item.amount ?? ""),
    note: item.note || item.description || item.sellerNote || "",
    tradeOpen: Boolean(item.tradeOpen ?? item.openToTrades ?? item.tradesOpen ?? true),
    status: item.status || "Available",
    interestCount: Number(item.interestCount || 0),
    imageData: item.imageData || item.photoData || item.mediaData || item.image || "",
    imageName: item.imageName || item.photoName || item.mediaName || "",
    imageAlt: item.imageAlt || item.alt || item.title || "",
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso(),
  }));

  const offers = asArray(source.offers).map((offer, index) => ({
    id: offer.id || `offer-migrated-${index}`,
    listingId: offer.listingId || offer.cardId || listings[0]?.id || "",
    type: offer.type || "Buy Offer",
    amount: String(offer.amount ?? offer.price ?? ""),
    tradeItem: offer.tradeItem || offer.trade || "",
    message: offer.message || offer.note || "",
    status: offer.status || "Pending",
    archived: Boolean(offer.archived),
    createdAt: offer.createdAt || nowIso(),
    updatedAt: offer.updatedAt || offer.createdAt || nowIso(),
  }));

  const rawPersonas = asArray(source.personas || source.profilePersonas);
  const personas = rawPersonas.length > 0
    ? rawPersonas.map(normalizePersona)
    : [normalizePersona(source.profile || defaultProfile, 0)];
  const profile = normalizePersona(source.profile || personas[0] || defaultProfile, 0);

  return {
    version: BLOCK_VERSION,
    listings,
    offers,
    savedIds: uniq(source.savedIds || source.savedCoreCards || source.saved || []),
    interestedSignals: asArray(source.interestedSignals || source.interested || []),
    sellerBoxRequests: asArray(source.sellerBoxRequests || source.sellerBoxes || []),
    selectedListingId: source.selectedListingId || source.selectedCoreCardId || listings[0]?.id || null,
    actions: asArray(source.actions || source.actionHistory || []),
    profile,
    personas,
    messageBoardOutline: asArray(source.messageBoardOutline).length ? asArray(source.messageBoardOutline) : MESSAGE_BOARD_OUTLINE,
    automation: {
      ...defaultAutomation,
      ...automationSource,
      rules: {
        ...defaultAutomation.rules,
        ...(automationSource.rules || {}),
      },
      events: asArray(automationSource.events),
    },
  };
}

function loadMemory() {
  const canonical = safeParse(localStorage.getItem(CANONICAL_KEY));
  if (canonical) return normalizeMemory(canonical);

  const candidates = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    const lower = key.toLowerCase();
    if (!LEGACY_KEY_HINTS.some((hint) => lower.includes(hint))) continue;
    const value = safeParse(localStorage.getItem(key));
    if (value && typeof value === "object") candidates.push(value);
  }

  const strongest = candidates.find((item) => Array.isArray(item.listings) || Array.isArray(item.offers));
  if (strongest) return normalizeMemory(strongest);

  return initialMemory;
}

function labelForListing(memory, listingId) {
  return memory.listings.find((listing) => listing.id === listingId)?.title || "CoreCard";
}

function addAction(memory, label, meta = {}) {
  const entry = {
    id: makeId("action"),
    label,
    type: meta.type || "Manual Action",
    detail: meta.detail || "",
    listingId: meta.listingId || null,
    offerId: meta.offerId || null,
    createdAt: nowIso(),
  };
  return {
    ...memory,
    actions: [entry, ...memory.actions].slice(0, 120),
  };
}

function addAutomationEvent(memory, title, detail, meta = {}) {
  if (!memory.automation.enabled) return memory;
  const event = {
    id: makeId("auto"),
    title,
    detail,
    trigger: meta.trigger || "system",
    listingId: meta.listingId || null,
    offerId: meta.offerId || null,
    createdAt: nowIso(),
  };
  return {
    ...memory,
    automation: {
      ...memory.automation,
      lastRunAt: event.createdAt,
      events: [event, ...memory.automation.events].slice(0, 120),
    },
  };
}

function updateListingStatus(memory, listingId, status) {
  if (!listingId) return memory;
  return {
    ...memory,
    listings: memory.listings.map((listing) =>
      listing.id === listingId ? { ...listing, status, updatedAt: nowIso() } : listing
    ),
  };
}

function applyAutomation(memory, trigger, meta = {}) {
  if (!memory.automation.enabled) return memory;
  const rules = memory.automation.rules;
  let next = { ...memory };
  const listingName = meta.listingId ? labelForListing(next, meta.listingId) : "CoreCard";

  if (trigger === "corecard_saved" && rules.savedCoreCardSignals) {
    const alreadyLogged = next.interestedSignals.some(
      (signal) => signal.listingId === meta.listingId && signal.source === "Saved CoreCard"
    );
    if (!alreadyLogged) {
      next = {
        ...next,
        interestedSignals: [
          {
            id: makeId("signal"),
            listingId: meta.listingId,
            source: "Saved CoreCard",
            strength: "Warm",
            createdAt: nowIso(),
          },
          ...next.interestedSignals,
        ],
      };
    }
    next = addAutomationEvent(
      next,
      "Interest signal logged",
      `${listingName} was saved, so SellCore marked it as a warm interest signal.`,
      { trigger, listingId: meta.listingId }
    );
  }

  if (trigger === "interest_marked" && rules.interestTracking) {
    next = {
      ...next,
      listings: next.listings.map((listing) =>
        listing.id === meta.listingId
          ? { ...listing, interestCount: Number(listing.interestCount || 0) + 1, updatedAt: nowIso() }
          : listing
      ),
      interestedSignals: [
        {
          id: makeId("signal"),
          listingId: meta.listingId,
          source: "Marked Interested",
          strength: "Strong",
          createdAt: nowIso(),
        },
        ...next.interestedSignals,
      ],
    };
    next = addAutomationEvent(
      next,
      "Interest count increased",
      `${listingName} received a stronger buyer interest signal.`,
      { trigger, listingId: meta.listingId }
    );
  }

  if (trigger === "offer_created" && rules.negotiationStatus) {
    next = updateListingStatus(next, meta.listingId, "Offer Pending");
    next = addAutomationEvent(
      next,
      "Offer moved into pipeline",
      `${listingName} now has a pending offer inside the deal pipeline.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "offer_accepted" && rules.negotiationStatus) {
    next = updateListingStatus(next, meta.listingId, "Negotiating");
    next = addAutomationEvent(
      next,
      "Active negotiation opened",
      `${listingName} moved into Active Negotiation after offer acceptance.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "offer_countered" && rules.negotiationStatus) {
    next = updateListingStatus(next, meta.listingId, "Negotiating");
    next = addAutomationEvent(
      next,
      "Counter pending",
      `${listingName} is waiting on the other side after a counter action.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "offer_declined" && rules.negotiationStatus) {
    next = addAutomationEvent(
      next,
      "Offer closed declined",
      `${listingName} had one offer closed without deleting the history.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "deal_completed" && rules.verifiedValueUpdates) {
    next = updateListingStatus(next, meta.listingId, "Completed");
    next = addAutomationEvent(
      next,
      "Verified Value updated",
      `${listingName} completed a deal, increasing local prototype trust value.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "seller_box_requested" && rules.sellerBoxPreparation) {
    next = updateListingStatus(next, meta.listingId, "Seller Box Requested");
    next = addAutomationEvent(
      next,
      "Seller Box prepared",
      `${listingName} now has a prepared Seller Box request state.`,
      { trigger, listingId: meta.listingId }
    );
  }

  if (trigger === "offer_archived" && rules.negotiationStatus) {
    next = addAutomationEvent(
      next,
      "Archived offer removed from active pipeline",
      `${listingName} kept its history while the archived offer left active deal flow.`,
      { trigger, listingId: meta.listingId, offerId: meta.offerId }
    );
  }

  if (trigger === "memory_exported" && rules.memoryProtectionEvents) {
    next = addAutomationEvent(
      next,
      "Memory protection event",
      "A SellCore memory backup was exported for continuity protection.",
      { trigger }
    );
  }

  if (trigger === "memory_imported" && rules.memoryProtectionEvents) {
    next = addAutomationEvent(
      next,
      "Memory restoration event",
      "A SellCore memory backup was imported and automation state was restored.",
      { trigger }
    );
  }

  return next;
}

function createBackupPayload(memory, uiState = null, drafts = null) {
  return {
    package: "SELLCORE_MEMORY_BACKUP",
    version: BLOCK_VERSION,
    exportedAt: nowIso(),
    canonicalStorageKey: CANONICAL_KEY,
    uiState: uiState ? normalizeUiState(uiState) : null,
    drafts: drafts ? normalizeDrafts(drafts) : null,
    saveability: {
      includesMemory: true,
      includesProfiles: true,
      includesListingMedia: true,
      includesProfileMedia: true,
      includesUiState: Boolean(uiState),
      includesDrafts: Boolean(drafts),
      storageEstimate: formatBytes(estimateLocalStorageBytes()),
    },
    memory,
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function imageFileToDataUrl(file, maxSide = 920, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const original = String(reader.result || "");
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height || 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(original);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = () => resolve(original);
      image.src = original;
    };
    reader.onerror = () => reject(reader.error || new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

function mediaCount(memory) {
  const listingMedia = asArray(memory.listings).filter((listing) => listing.imageData).length;
  const personaMedia = asArray(memory.personas).filter((persona) => persona.avatarData || persona.bannerData).length;
  return listingMedia + personaMedia;
}

function getStatusClass(status) {
  return String(status || "Available").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function numericPrice(value) {
  const parsed = Number(String(value || "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getQualityChecks(listing, memory) {
  const offersForListing = memory.offers.filter((offer) => offer.listingId === listing.id);
  const hasSellerBox = memory.sellerBoxRequests.some((request) => request.listingId === listing.id);
  return [
    { label: "Has title", pass: Boolean(String(listing.title || "").trim()) },
    { label: "Has price", pass: numericPrice(listing.price) > 0 },
    { label: "Has location", pass: Boolean(String(listing.location || "").trim()) },
    { label: "Has seller note", pass: Boolean(String(listing.note || "").trim()) },
    { label: "Has image", pass: Boolean(listing.imageData) },
    { label: "Trade status set", pass: typeof listing.tradeOpen === "boolean" },
    { label: "Has offers", pass: offersForListing.length > 0 },
    { label: "Seller Box requested", pass: hasSellerBox },
    { label: "Saved locally", pass: memory.savedIds.includes(listing.id) },
  ];
}

function qualityScore(listing, memory) {
  const checks = getQualityChecks(listing, memory);
  return checks.filter((check) => check.pass).length;
}

function App() {
  const [memory, setMemory] = useState(loadMemory);
  const [activeScreen, setActiveScreen] = useState(() => loadUiState().activeScreen);
  const [listingDraft, setListingDraft] = useState(() => loadDraftState().listingDraft);
  const [offerDraft, setOfferDraft] = useState(() => loadDraftState().offerDraft);
  const [showSavedOnly, setShowSavedOnly] = useState(() => loadUiState().showSavedOnly);
  const [sellerBoxType, setSellerBoxType] = useState(() => loadUiState().sellerBoxType);
  const [discovery, setDiscovery] = useState(() => loadUiState().discovery);
  const [profileDraft, setProfileDraft] = useState(() => loadDraftState().profileDraft);
  const [historyFilter, setHistoryFilter] = useState(() => loadUiState().historyFilter);
  const [lastFullSaveAt, setLastFullSaveAt] = useState(() => localStorage.getItem(LAST_SAVE_KEY) || "");
  const [builderTrayOpen, setBuilderTrayOpen] = useState(false);
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const importRef = useRef(null);
  const listingImageRef = useRef(null);
  const personaAvatarRef = useRef(null);
  const personaBannerRef = useRef(null);
  const activeAvatarRef = useRef(null);
  const activeBannerRef = useRef(null);

  function buildUiState() {
    return normalizeUiState({ activeScreen, showSavedOnly, sellerBoxType, discovery, historyFilter });
  }

  function buildDraftState() {
    return normalizeDrafts({ listingDraft, offerDraft, profileDraft });
  }

  useEffect(() => {
    localStorage.setItem(CANONICAL_KEY, JSON.stringify(memory));
  }, [memory]);

  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(buildUiState()));
  }, [activeScreen, showSavedOnly, sellerBoxType, discovery, historyFilter]);

  useEffect(() => {
    localStorage.setItem(DRAFT_STATE_KEY, JSON.stringify(buildDraftState()));
  }, [listingDraft, offerDraft, profileDraft]);

  const selectedListing = useMemo(
    () => memory.listings.find((listing) => listing.id === memory.selectedListingId) || memory.listings[0] || null,
    [memory.listings, memory.selectedListingId]
  );

  const stats = useMemo(() => {
    const activeOffers = memory.offers.filter(
      (offer) => !offer.archived && !["Completed", "Closed / Declined"].includes(offer.status)
    );
    const completedDeals = memory.offers.filter((offer) => offer.status === "Completed").length;
    const verifiedValue =
      completedDeals * 10 +
      memory.savedIds.length * 2 +
      memory.sellerBoxRequests.length * 3 +
      activeOffers.length +
      memory.interestedSignals.length +
      Math.min(memory.automation.events.length, 25);

    return {
      listings: memory.listings.length,
      offers: memory.offers.length,
      saved: memory.savedIds.length,
      completedDeals,
      sellerBoxes: memory.sellerBoxRequests.length,
      interestSignals: memory.interestedSignals.length,
      actions: memory.actions.length,
      activeDeals: activeOffers.length,
      verifiedValue,
      personas: memory.personas.length,
      mediaAssets: mediaCount(memory),
      storageUsed: formatBytes(estimateLocalStorageBytes()),
      lastFullSaveAt,
    };
  }, [memory, lastFullSaveAt]);

  const pipeline = useMemo(() => {
    const byStatus = (status) => memory.offers.filter((offer) => !offer.archived && offer.status === status);
    return {
      newCoreCards: memory.listings.filter((listing) => listing.status === "Available"),
      interested: memory.listings.filter(
        (listing) => memory.savedIds.includes(listing.id) || Number(listing.interestCount || 0) > 0
      ),
      pendingOffers: byStatus("Pending"),
      counteredOffers: byStatus("Counter Pending"),
      activeNegotiations: byStatus("Active Negotiation"),
      sellerBoxRequests: memory.sellerBoxRequests,
      completedDeals: memory.offers.filter((offer) => offer.status === "Completed"),
      archivedOffers: memory.offers.filter((offer) => offer.archived),
    };
  }, [memory]);

  const suggestions = useMemo(() => {
    const nextMoves = [];
    if (!memory.automation.enabled) nextMoves.push("Turn automation back on before testing the full saveable marketplace loop.");
    if (memory.listings.length === 0) nextMoves.push("Create a listing so the Discovery layer has a CoreCard to rank.");
    if (memory.savedIds.length > 0 && memory.interestedSignals.length === 0) nextMoves.push("Mark saved CoreCards as interest signals.");
    if (pipeline.pendingOffers.length > 0) nextMoves.push("Accept, counter, or decline pending offers to move the pipeline.");
    if (pipeline.activeNegotiations.length > 0) nextMoves.push("Request Seller Box or complete deal for active negotiations.");
    if (memory.sellerBoxRequests.length > 0 && stats.completedDeals === 0) nextMoves.push("Complete a deal to increase Verified Value.");
    if (memory.actions.length > 10) nextMoves.push("Export a memory backup after this test run.");
    if (nextMoves.length === 0) nextMoves.push("Create listing â†’ save â†’ mark interested â†’ offer â†’ accept â†’ complete deal.");
    return nextMoves.slice(0, 5);
  }, [memory, pipeline, stats.completedDeals]);

  const marketplaceOptions = useMemo(() => {
    const categories = ["All", ...uniq(memory.listings.map((listing) => listing.category || "Daily Goods"))];
    const conditions = ["All", ...uniq(memory.listings.map((listing) => listing.condition || "Used"))];
    const statuses = ["All", ...uniq(memory.listings.map((listing) => listing.status || "Available"))];
    return { categories, conditions, statuses };
  }, [memory.listings]);

  const visibleListings = useMemo(() => {
    const query = discovery.search.trim().toLowerCase();
    const filtered = memory.listings.filter((listing) => {
      const listingText = [listing.title, listing.category, listing.condition, listing.location, listing.note, listing.imageName, listing.imageAlt]
        .join(" ")
        .toLowerCase();
      const hasActiveOffer = memory.offers.some(
        (offer) => offer.listingId === listing.id && !offer.archived && !["Completed", "Closed / Declined"].includes(offer.status)
      );
      const hasCompletedDeal = memory.offers.some((offer) => offer.listingId === listing.id && offer.status === "Completed");
      const saved = memory.savedIds.includes(listing.id);

      if (showSavedOnly && !saved) return false;
      if (query && !listingText.includes(query)) return false;
      if (discovery.category !== "All" && listing.category !== discovery.category) return false;
      if (discovery.condition !== "All" && listing.condition !== discovery.condition) return false;
      if (discovery.status !== "All" && listing.status !== discovery.status) return false;
      if (discovery.trade === "Trade open" && !listing.tradeOpen) return false;
      if (discovery.trade === "No trades" && listing.tradeOpen) return false;
      if (discovery.saved === "Saved only" && !saved) return false;
      if (discovery.saved === "Unsaved only" && saved) return false;
      if (discovery.deal === "Active offers" && !hasActiveOffer) return false;
      if (discovery.deal === "Completed deals" && !hasCompletedDeal) return false;
      if (discovery.deal === "No active offers" && hasActiveOffer) return false;
      if (discovery.actionFilter === "Saved" && !saved) return false;
      if (discovery.actionFilter === "Trade Open" && !listing.tradeOpen) return false;
      if (discovery.actionFilter === "Available" && listing.status !== "Available") return false;
      if (discovery.actionFilter === "Negotiating" && listing.status !== "Negotiating") return false;
      if (discovery.actionFilter === "Completed" && listing.status !== "Completed") return false;
      if (discovery.actionFilter === "Seller Box Requested" && listing.status !== "Seller Box Requested") return false;
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (discovery.sort === "Price low to high") return numericPrice(a.price) - numericPrice(b.price);
      if (discovery.sort === "Price high to low") return numericPrice(b.price) - numericPrice(a.price);
      if (discovery.sort === "Most active offers") {
        const aOffers = memory.offers.filter((offer) => offer.listingId === a.id && !offer.archived).length;
        const bOffers = memory.offers.filter((offer) => offer.listingId === b.id && !offer.archived).length;
        return bOffers - aOffers;
      }
      if (discovery.sort === "Saved first") return Number(memory.savedIds.includes(b.id)) - Number(memory.savedIds.includes(a.id));
      if (discovery.sort === "Trade-open first") return Number(b.tradeOpen) - Number(a.tradeOpen);
      if (discovery.sort === "Quality score") return qualityScore(b, memory) - qualityScore(a, memory);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return sorted;
  }, [memory, discovery, showSavedOnly]);

  function mutate(recipe) {
    setMemory((current) => normalizeMemory(recipe(normalizeMemory(current))));
  }

  function createListing(event) {
    event.preventDefault();
    const title = listingDraft.title.trim();
    if (!title) return;
    mutate((current) => {
      const listing = {
        ...listingDraft,
        id: makeId("listing"),
        title,
        price: String(listingDraft.price || "0"),
        status: "Available",
        interestCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      let next = {
        ...current,
        listings: [listing, ...current.listings],
        selectedListingId: listing.id,
      };
      next = addAction(next, "Create CoreCard", {
        type: "Listing Action",
        detail: `${listing.title} entered the marketplace feed.`,
        listingId: listing.id,
      });
      return next;
    });
    setListingDraft(emptyListing);
    setActiveScreen("feed");
  }

  function selectListing(id) {
    mutate((current) => ({ ...current, selectedListingId: id }));
  }

  function toggleSave(listingId) {
    mutate((current) => {
      const saved = current.savedIds.includes(listingId);
      let next = {
        ...current,
        savedIds: saved ? current.savedIds.filter((id) => id !== listingId) : [listingId, ...current.savedIds],
        selectedListingId: listingId,
      };
      next = addAction(next, saved ? "Unsave CoreCard" : "Save CoreCard", {
        type: "CoreCard Action",
        detail: labelForListing(current, listingId),
        listingId,
      });
      if (!saved) next = applyAutomation(next, "corecard_saved", { listingId });
      return next;
    });
  }

  function markInterested(listingId) {
    mutate((current) => {
      let next = addAction(current, "Mark Interested", {
        type: "Buyer Signal",
        detail: labelForListing(current, listingId),
        listingId,
      });
      next = applyAutomation(next, "interest_marked", { listingId });
      return next;
    });
  }

  function requestSellerBox(listingId, boxType = sellerBoxType) {
    mutate((current) => {
      const request = {
        id: makeId("sellerbox"),
        listingId,
        type: boxType,
        status: "Prepared",
        createdAt: nowIso(),
      };
      let next = {
        ...current,
        sellerBoxRequests: [request, ...current.sellerBoxRequests],
      };
      next = addAction(next, "Request Seller Box", {
        type: "Trust Action",
        detail: `${labelForListing(current, listingId)} â€” ${boxType}`,
        listingId,
      });
      next = applyAutomation(next, "seller_box_requested", { listingId });
      return next;
    });
  }

  async function copySummary(listing) {
    const summary = `${listing.title} | $${listing.price || "0"} | ${listing.condition} | ${listing.location} | ${listing.note}`;
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      window.prompt("Copy CoreCard summary:", summary);
    }
    mutate((current) =>
      addAction(current, "Copy CoreCard Summary", {
        type: "Utility Action",
        detail: listing.title,
        listingId: listing.id,
      })
    );
  }

  function duplicateListing(listing) {
    mutate((current) => {
      const duplicate = {
        ...listing,
        id: makeId("listing"),
        title: `${listing.title} Copy`,
        status: "Available",
        interestCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      let next = { ...current, listings: [duplicate, ...current.listings], selectedListingId: duplicate.id };
      next = addAction(next, "Duplicate Listing", {
        type: "Listing Action",
        detail: duplicate.title,
        listingId: duplicate.id,
      });
      return next;
    });
  }

  function createOffer(event) {
    event.preventDefault();
    if (!selectedListing) return;
    mutate((current) => {
      const offer = {
        id: makeId("offer"),
        listingId: selectedListing.id,
        type: offerDraft.type,
        amount: offerDraft.amount,
        tradeItem: offerDraft.tradeItem,
        message: offerDraft.message,
        status: "Pending",
        archived: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      let next = { ...current, offers: [offer, ...current.offers] };
      next = addAction(next, `Create ${offer.type}`, {
        type: "Offer Action",
        detail: selectedListing.title,
        listingId: selectedListing.id,
        offerId: offer.id,
      });
      next = applyAutomation(next, "offer_created", { listingId: selectedListing.id, offerId: offer.id });
      return next;
    });
    setOfferDraft(emptyOffer);
    setActiveScreen("offers");
  }

  function updateOfferStatus(offerId, status, trigger) {
    mutate((current) => {
      const target = current.offers.find((offer) => offer.id === offerId);
      if (!target) return current;
      let next = {
        ...current,
        offers: current.offers.map((offer) =>
          offer.id === offerId ? { ...offer, status, updatedAt: nowIso() } : offer
        ),
      };
      next = addAction(next, status, {
        type: "Offer Decision",
        detail: labelForListing(current, target.listingId),
        listingId: target.listingId,
        offerId,
      });
      next = applyAutomation(next, trigger, { listingId: target.listingId, offerId });
      return next;
    });
  }

  function archiveOffer(offerId, archived) {
    mutate((current) => {
      const target = current.offers.find((offer) => offer.id === offerId);
      if (!target) return current;
      let next = {
        ...current,
        offers: current.offers.map((offer) =>
          offer.id === offerId ? { ...offer, archived, updatedAt: nowIso() } : offer
        ),
      };
      next = addAction(next, archived ? "Archive Offer" : "Restore Offer", {
        type: "Offer Action",
        detail: labelForListing(current, target.listingId),
        listingId: target.listingId,
        offerId,
      });
      if (archived) next = applyAutomation(next, "offer_archived", { listingId: target.listingId, offerId });
      return next;
    });
  }

  function saveEverything() {
    mutate((current) => {
      let next = addAction(current, "Save Everything", {
        type: "Saveability Layer",
        detail: "Memory, media, drafts, filters, active screen, and profile/feed output were saved locally.",
      });
      const savedAt = nowIso();
      localStorage.setItem(CANONICAL_KEY, JSON.stringify(next));
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(buildUiState()));
      localStorage.setItem(DRAFT_STATE_KEY, JSON.stringify(buildDraftState()));
      localStorage.setItem(LAST_SAVE_KEY, savedAt);
      setLastFullSaveAt(savedAt);
      return next;
    });
  }

  function exportMemory() {
    let exported = null;
    mutate((current) => {
      let next = addAction(current, "Export Full Save Backup", {
        type: "Memory Guard",
        detail: "Full save package created with memory, media, workspace state, drafts, filters, and profile/feed output.",
      });
      next = applyAutomation(next, "memory_exported");
      const savedAt = nowIso();
      localStorage.setItem(CANONICAL_KEY, JSON.stringify(next));
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(buildUiState()));
      localStorage.setItem(DRAFT_STATE_KEY, JSON.stringify(buildDraftState()));
      localStorage.setItem(LAST_SAVE_KEY, savedAt);
      setLastFullSaveAt(savedAt);
      exported = createBackupPayload(next, buildUiState(), buildDraftState());
      return next;
    });
    setTimeout(() => {
      if (exported) downloadJson("SellCore-Foundation-11-FullSaveBackup.json", exported);
    }, 0);
  }

  function importMemoryFromObject(payload) {
    const restored = normalizeMemory(payload.memory || payload);
    const importedUi = payload.uiState ? normalizeUiState(payload.uiState) : null;
    const importedDrafts = payload.drafts ? normalizeDrafts(payload.drafts) : null;
    let next = addAction(restored, "Import Full Save Backup", {
      type: "Memory Guard",
      detail: "Full memory bridge restored from backup package, including saved workspace state when available.",
    });
    next = applyAutomation(next, "memory_imported");
    setMemory(next);
    if (importedUi) {
      setActiveScreen(importedUi.activeScreen);
      setShowSavedOnly(importedUi.showSavedOnly);
      setSellerBoxType(importedUi.sellerBoxType);
      setDiscovery(importedUi.discovery);
      setHistoryFilter(importedUi.historyFilter);
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(importedUi));
    }
    if (importedDrafts) {
      setListingDraft(importedDrafts.listingDraft);
      setOfferDraft(importedDrafts.offerDraft);
      setProfileDraft(importedDrafts.profileDraft);
      localStorage.setItem(DRAFT_STATE_KEY, JSON.stringify(importedDrafts));
    }
    const savedAt = nowIso();
    localStorage.setItem(LAST_SAVE_KEY, savedAt);
    setLastFullSaveAt(savedAt);
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const payload = safeParse(String(reader.result || ""));
      if (payload) importMemoryFromObject(payload);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function resetDemoMemory() {
    const reset = addAction(initialMemory, "Reset Demo Memory", {
      type: "Memory Guard",
      detail: "Demo state rebuilt for Block 11 saveability and media continuity testing.",
    });
    setMemory(reset);
    setActiveScreen("feed");
    setDiscovery(defaultDiscovery);
    setShowSavedOnly(false);
    setSellerBoxType(SELLER_BOX_TYPES[0]);
    setHistoryFilter("All");
    setListingDraft(emptyListing);
    setOfferDraft(emptyOffer);
    setProfileDraft(emptyPersonaDraft);
    localStorage.removeItem(UI_STATE_KEY);
    localStorage.removeItem(DRAFT_STATE_KEY);
  }

  function toggleAutomation() {
    mutate((current) => ({
      ...current,
      automation: {
        ...current.automation,
        enabled: !current.automation.enabled,
        lastRunAt: nowIso(),
      },
    }));
  }

  function toggleRule(rule) {
    mutate((current) => ({
      ...current,
      automation: {
        ...current.automation,
        rules: {
          ...current.automation.rules,
          [rule]: !current.automation.rules[rule],
        },
        lastRunAt: nowIso(),
      },
    }));
  }

  function updateDiscovery(field, value) {
    setDiscovery((current) => ({ ...current, [field]: value }));
  }

  function resetDiscovery() {
    setDiscovery(defaultDiscovery);
    setShowSavedOnly(false);
  }

  async function handleListingImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageData = await imageFileToDataUrl(file);
    setListingDraft((current) => ({
      ...current,
      imageData,
      imageName: file.name,
      imageAlt: current.imageAlt || current.title || "SellCore listing image",
    }));
    event.target.value = "";
  }

  function clearListingDraftImage() {
    setListingDraft((current) => ({ ...current, imageData: "", imageName: "", imageAlt: "" }));
  }

  async function handlePersonaMedia(event, field) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageData = await imageFileToDataUrl(file, field === "avatar" ? 520 : 980, field === "avatar" ? 0.82 : 0.76);
    setProfileDraft((current) => ({
      ...current,
      [`${field}Data`]: imageData,
      [`${field}Name`]: file.name,
    }));
    event.target.value = "";
  }

  async function handleActiveProfileMedia(event, field) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageData = await imageFileToDataUrl(file, field === "avatar" ? 520 : 980, field === "avatar" ? 0.82 : 0.76);
    mutate((current) => {
      const updatedProfile = {
        ...current.profile,
        [`${field}Data`]: imageData,
        [`${field}Name`]: file.name,
        updatedAt: nowIso(),
      };
      let next = {
        ...current,
        profile: updatedProfile,
        personas: current.personas.map((persona) =>
          persona.id === current.profile.id ? { ...persona, ...updatedProfile } : persona
        ),
      };
      next = addAction(next, field === "avatar" ? "Update Profile Picture" : "Update Profile Banner", {
        type: "Media Action",
        detail: `${updatedProfile.displayName} updated ${field} media.`,
      });
      return next;
    });
    event.target.value = "";
  }

  function clearActiveProfileMedia(field) {
    mutate((current) => {
      const updatedProfile = {
        ...current.profile,
        [`${field}Data`]: "",
        [`${field}Name`]: "",
        updatedAt: nowIso(),
      };
      let next = {
        ...current,
        profile: updatedProfile,
        personas: current.personas.map((persona) =>
          persona.id === current.profile.id ? { ...persona, ...updatedProfile } : persona
        ),
      };
      next = addAction(next, field === "avatar" ? "Remove Profile Picture" : "Remove Profile Banner", {
        type: "Media Action",
        detail: `${updatedProfile.displayName} removed ${field} media.`,
      });
      return next;
    });
  }

  function applyMarketActionFilter(actionFilter) {
    setDiscovery((current) => ({ ...current, actionFilter }));
    if (actionFilter === "Saved") setShowSavedOnly(false);
  }

  function createPersona(event) {
    event.preventDefault();
    const displayName = profileDraft.displayName.trim();
    if (!displayName) return;
    mutate((current) => {
      const persona = normalizePersona({
        ...profileDraft,
        id: makeId("persona"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }, current.personas.length + 1);
      let next = {
        ...current,
        profile: persona,
        personas: [persona, ...current.personas],
      };
      next = addAction(next, "Create Profile Persona", {
        type: "Profile Action",
        detail: `${persona.displayName} â€” ${persona.personaTitle}`,
      });
      return next;
    });
    setProfileDraft(emptyPersonaDraft);
  }

  function activatePersona(personaId) {
    mutate((current) => {
      const persona = current.personas.find((item) => item.id === personaId);
      if (!persona) return current;
      let next = { ...current, profile: { ...persona, updatedAt: nowIso() } };
      next = addAction(next, "Activate Profile Persona", {
        type: "Profile Action",
        detail: `${persona.displayName} became the active Core profile.`,
      });
      return next;
    });
  }

  function deletePersona(personaId) {
    mutate((current) => {
      const remaining = current.personas.filter((persona) => persona.id !== personaId);
      const nextProfile = current.profile.id === personaId ? remaining[0] || defaultProfile : current.profile;
      let next = { ...current, profile: nextProfile, personas: remaining.length ? remaining : [defaultProfile] };
      next = addAction(next, "Delete Profile Persona", {
        type: "Profile Action",
        detail: "A custom SellCore persona was removed from local memory.",
      });
      return next;
    });
  }

  const combinedHistory = [
    ...memory.actions.map((action) => ({ ...action, source: "Action", title: action.label, description: action.detail || action.type })),
    ...memory.automation.events.map((event) => ({ ...event, source: "Automation", description: event.detail })),
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const filteredHistory = combinedHistory.filter((item) => historyFilter === "All" || item.source === historyFilter);

  return (
    <main className="sellcoreApp blockNineApp blockTenApp">
      <section className="heroPanel blockNineHero compactFeedHero">
        <div className="brandTopIdentity">
          <p className="eyebrow compactBrandLine">SELLCORE â€” Social Marketplace for Daily Goods</p>
          <p className="compactFoundationLine">Save Everything + Media Continuity</p>
        </div>

        <div className="topControlCluster controlsTopRight">
          <div className="sideMenuControl">
            <button
              type="button"
              className="sideMenuButton"
              aria-label="Open SellCore feed menu"
              aria-expanded={topMenuOpen}
              onClick={() => {
                setTopMenuOpen((open) => !open);
                setBuilderTrayOpen(false);
              }}
            >
              <span>â˜°</span>
            </button>

            {topMenuOpen && (
              <div className="sideMenuTray" role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen("feed");
                    setShowSavedOnly(false);
                    setTopMenuOpen(false);
                  }}
                >
                  <span>Listings</span>
                  <strong>{stats.listings}</strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen("market");
                    updateDiscovery("deal", "Active offers");
                    setShowSavedOnly(false);
                    setTopMenuOpen(false);
                  }}
                >
                  <span>Active Deals</span>
                  <strong>{stats.activeDeals}</strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen("feed");
                    setShowSavedOnly(true);
                    updateDiscovery("saved", "Saved only");
                    setTopMenuOpen(false);
                  }}
                >
                  <span>Saved</span>
                  <strong>{stats.saved}</strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen("profiles");
                    setTopMenuOpen(false);
                  }}
                >
                  <span>Personas</span>
                  <strong>{stats.personas}</strong>
                </button>
              </div>
            )}
          </div>

          <div className="builderTopControl">
            <button
              type="button"
              className="builderToggleButton"
              aria-expanded={builderTrayOpen}
              onClick={() => {
                setBuilderTrayOpen((open) => !open);
                setTopMenuOpen(false);
              }}
            >
              SellCore Builders
            </button>

            {builderTrayOpen && (
              <div className="builderTray" role="menu">
                <button
                  type="button"
                  className={activeScreen === "history" ? "activeBuilderAction" : ""}
                  onClick={() => {
                    setActiveScreen("history");
                    setBuilderTrayOpen(false);
                  }}
                >
                  History
                </button>
                <button
                  type="button"
                  className={activeScreen === "utilities" ? "activeBuilderAction" : ""}
                  onClick={() => {
                    setActiveScreen("utilities");
                    setBuilderTrayOpen(false);
                  }}
                >
                  Utilities
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {activeScreen === "feed" && (
        <section className="layoutGrid">
          <div className="panel widePanel">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Feed Module</p>
                <h2>CoreCard Feed</h2>
              </div>
              <button className="ghostButton" onClick={() => setActiveScreen("market")}>Filter Market</button>
            </div>
            <div className="cardGrid">
              {visibleListings.map((listing) => {
                const checks = getQualityChecks(listing, memory);
                const passedChecks = checks.filter((check) => check.pass).length;
                const activeOfferCount = memory.offers.filter((offer) => offer.listingId === listing.id && !offer.archived).length;
                return (
                  <article key={listing.id} className={selectedListing?.id === listing.id ? "coreCard selectedCoreCard" : "coreCard"} onClick={() => selectListing(listing.id)}>
                    {listing.imageData ? (
                      <figure className="mediaFrame listingMedia"><img src={listing.imageData} alt={listing.imageAlt || listing.title} /></figure>
                    ) : (
                      <div className="mediaFrame emptyMediaFrame"><span>No image yet</span></div>
                    )}
                    <div className="cardTopline">
                      <span className={`statusPill ${getStatusClass(listing.status)}`}>{listing.status}</span>
                      <span>{listing.category}</span>
                    </div>
                    <h3>{listing.title}</h3>
                    <p>{listing.note || "No seller note yet."}</p>
                    <div className="valueRow"><strong>${listing.price || "0"}</strong><span>{listing.condition}</span><span>{listing.location}</span></div>
                    <div className="trustStrip"><span>{passedChecks}/{checks.length} quality</span><span>{activeOfferCount} offers</span><span>{listing.tradeOpen ? "Trades open" : "No trades"}</span>{memory.savedIds.includes(listing.id) && <span>Saved</span>}</div>
{listing.proofPack && (
  <div className="proofPackMeta">
    <strong>ProofPack {listing.proofPack.proofPackVersion || "020"}</strong>
    <span>Status: {listing.proofPack.verificationStatus || "pending"}</span>
    <span>Condition: {listing.proofPack.condition || "unverified"}</span>
    <span>Trust Score: {listing.proofPack.trustScore ?? 0}</span>
  </div>
)}
                    <div className="cardActions" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => toggleSave(listing.id)}>{memory.savedIds.includes(listing.id) ? "Unsave" : "Save"}</button>
                      <button onClick={() => markInterested(listing.id)}>Interested</button>
                      <button onClick={() => requestSellerBox(listing.id)}>Seller Box</button>
                    </div>
                  </article>
                );
              })}
              {visibleListings.length === 0 && <p className="emptyState">No CoreCards match this view. Tap Market to clear or change filters.</p>}
            </div>
          </div>

          <aside className="panel detailPanel">
            {selectedListing ? (
              <>
                <p className="eyebrow">Selected CoreCard</p>
                <h2>{selectedListing.title}</h2>
                <span className={`statusPill ${getStatusClass(selectedListing.status)}`}>{selectedListing.status}</span>
                {selectedListing.imageData && <figure className="mediaFrame detailMedia"><img src={selectedListing.imageData} alt={selectedListing.imageAlt || selectedListing.title} /></figure>}
                <p>{selectedListing.note}</p>
                <div className="detailList">
                  <span>Price <strong>${selectedListing.price || "0"}</strong></span>
                  <span>Condition <strong>{selectedListing.condition}</strong></span>
                  <span>Trades <strong>{selectedListing.tradeOpen ? "Open" : "Closed"}</strong></span>
                  <span>Interest <strong>{selectedListing.interestCount || 0}</strong></span>
                </div>
                <div className="qualityChecklist">
                  <h3>CoreCard Quality Checklist</h3>
                  {getQualityChecks(selectedListing, memory).map((check) => <span key={check.label} className={check.pass ? "checkPass" : "checkWait"}>{check.pass ? "âœ“" : "â€¢"} {check.label}</span>)}
                </div>
                <form className="offerForm" onSubmit={createOffer}>
                  <select value={offerDraft.type} onChange={(event) => setOfferDraft({ ...offerDraft, type: event.target.value })}><option>Buy Offer</option><option>Trade Offer</option></select>
                  <input placeholder="Cash amount" value={offerDraft.amount} onChange={(event) => setOfferDraft({ ...offerDraft, amount: event.target.value })} />
                  <input placeholder="Trade item" value={offerDraft.tradeItem} onChange={(event) => setOfferDraft({ ...offerDraft, tradeItem: event.target.value })} />
                  <textarea placeholder="Offer message" value={offerDraft.message} onChange={(event) => setOfferDraft({ ...offerDraft, message: event.target.value })} />
                  <button className="primaryButton" type="submit">Create Offer</button>
                </form>
                <div className="sellerBoxSelector">
                  <h3>Seller Box Type</h3>
                  <select value={sellerBoxType} onChange={(event) => setSellerBoxType(event.target.value)}>{SELLER_BOX_TYPES.map((boxType) => <option key={boxType}>{boxType}</option>)}</select>
                  <button onClick={() => requestSellerBox(selectedListing.id, sellerBoxType)}>Prepare {sellerBoxType}</button>
                </div>
                <div className="cardActions stackedActions"><button onClick={() => copySummary(selectedListing)}>Copy Summary</button><button onClick={() => duplicateListing(selectedListing)}>Duplicate Listing</button></div>
              </>
            ) : <p>No CoreCard selected.</p>}
          </aside>
        </section>
      )}

      {activeScreen === "create" && (
        <section className="panel formPanel">
          <div className="sectionHeader"><div><p className="eyebrow">Create Listing</p><h2>List it fast. Build trust.</h2></div></div>
          <form className="listingForm" onSubmit={createListing}>
            <div className="mediaUploader">
              <div>
                <strong>Listing photo</strong>
                <span>Use camera or choose image. Saved into local SellCore memory for feed output.</span>
              </div>
              {listingDraft.imageData ? <figure className="mediaFrame draftMedia"><img src={listingDraft.imageData} alt={listingDraft.imageAlt || listingDraft.title || "Listing preview"} /></figure> : <div className="mediaFrame emptyMediaFrame"><span>Photo preview</span></div>}
              <div className="cardActions"><button type="button" onClick={() => listingImageRef.current?.click()}>Camera / Upload</button><button type="button" onClick={clearListingDraftImage}>Remove</button></div>
              <input ref={listingImageRef} type="file" accept="image/*" capture="environment" onChange={handleListingImage} hidden />
            </div>
            <input required placeholder="Title" value={listingDraft.title} onChange={(event) => setListingDraft({ ...listingDraft, title: event.target.value })} />
            <input placeholder="Category" value={listingDraft.category} onChange={(event) => setListingDraft({ ...listingDraft, category: event.target.value })} />
            <input placeholder="Condition" value={listingDraft.condition} onChange={(event) => setListingDraft({ ...listingDraft, condition: event.target.value })} />
            <input placeholder="Location" value={listingDraft.location} onChange={(event) => setListingDraft({ ...listingDraft, location: event.target.value })} />
            <input placeholder="Price" value={listingDraft.price} onChange={(event) => setListingDraft({ ...listingDraft, price: event.target.value })} />
            <textarea placeholder="Seller note" value={listingDraft.note} onChange={(event) => setListingDraft({ ...listingDraft, note: event.target.value })} />
            <input placeholder="Image alt text / visual note" value={listingDraft.imageAlt} onChange={(event) => setListingDraft({ ...listingDraft, imageAlt: event.target.value })} />
            <label className="toggleLine"><input type="checkbox" checked={listingDraft.tradeOpen} onChange={(event) => setListingDraft({ ...listingDraft, tradeOpen: event.target.checked })} />Open to trades</label>
            <button className="primaryButton" type="submit">Create CoreCard</button>
          </form>
        </section>
      )}

      {activeScreen === "market" && (
        <section className="panel widePanel">
          <div className="sectionHeader"><div><p className="eyebrow">Discovery Control</p><h2>Marketplace Filters</h2></div><button className="ghostButton" onClick={resetDiscovery}>Clear Discovery</button></div>
          <div className="filterActionRail">
            {MARKET_FILTER_ACTIONS.map((action) => <button key={action} className={discovery.actionFilter === action ? "activeFilterAction" : ""} onClick={() => applyMarketActionFilter(action)}>{action}</button>)}
          </div>
          <div className="discoveryPanel blockNineDiscovery">
            <input placeholder="Search title, category, condition, location, seller note" value={discovery.search} onChange={(event) => updateDiscovery("search", event.target.value)} />
            <select value={discovery.category} onChange={(event) => updateDiscovery("category", event.target.value)}>{marketplaceOptions.categories.map((category) => <option key={category}>{category}</option>)}</select>
            <select value={discovery.condition} onChange={(event) => updateDiscovery("condition", event.target.value)}>{marketplaceOptions.conditions.map((condition) => <option key={condition}>{condition}</option>)}</select>
            <select value={discovery.status} onChange={(event) => updateDiscovery("status", event.target.value)}>{marketplaceOptions.statuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select value={discovery.trade} onChange={(event) => updateDiscovery("trade", event.target.value)}><option>All</option><option>Trade open</option><option>No trades</option></select>
            <select value={discovery.saved} onChange={(event) => updateDiscovery("saved", event.target.value)}><option>All</option><option>Saved only</option><option>Unsaved only</option></select>
            <select value={discovery.deal} onChange={(event) => updateDiscovery("deal", event.target.value)}><option>All</option><option>Active offers</option><option>Completed deals</option><option>No active offers</option></select>
            <select value={discovery.sort} onChange={(event) => updateDiscovery("sort", event.target.value)}><option>Newest first</option><option>Price low to high</option><option>Price high to low</option><option>Most active offers</option><option>Saved first</option><option>Trade-open first</option><option>Quality score</option></select>
          </div>
          <p className="resultLine">Showing {visibleListings.length} of {memory.listings.length} CoreCards â€¢ Filter action: {discovery.actionFilter}</p>
          <div className="miniListingStack">
            {visibleListings.map((listing) => <button key={listing.id} className="miniListingButton" onClick={() => { selectListing(listing.id); setActiveScreen("feed"); }}><strong>{listing.title}</strong><span>{listing.status} â€¢ ${listing.price || "0"} â€¢ {listing.category}</span></button>)}
            {visibleListings.length === 0 && <p className="emptyState">No matches. Clear discovery or create a new CoreCard.</p>}
          </div>
        </section>
      )}

      {activeScreen === "profiles" && (
        <section className="layoutGrid">
          <div className="panel widePanel">
            <div className="sectionHeader"><div><p className="eyebrow">Core Profiles</p><h2>Active Profile Persona</h2></div></div>
            <article className="activePersonaCard">
              {memory.profile.bannerData && <figure className="profileBanner"><img src={memory.profile.bannerData} alt={`${memory.profile.displayName} banner`} /></figure>}
              <div className="profileIdentityRow">
                {memory.profile.avatarData ? <img className="profileAvatar" src={memory.profile.avatarData} alt={`${memory.profile.displayName} profile`} /> : <div className="profileAvatar placeholderAvatar">{memory.profile.displayName.slice(0, 1)}</div>}
                <div><span className="badge gold">{memory.profile.badge}</span><h2>{memory.profile.displayName}</h2></div>
              </div>
              <h3>{memory.profile.personaTitle}</h3>
              <p>{memory.profile.trustNote}</p>
              <div className="personaGrid"><span>Zone <strong>{memory.profile.localZone}</strong></span><span>Style <strong>{memory.profile.sellerStyle}</strong></span><span>Deal Type <strong>{memory.profile.preferredDeal}</strong></span><span>Motto <strong>{memory.profile.motto}</strong></span></div>
              <div className="cardActions mediaProfileActions"><button onClick={() => activeAvatarRef.current?.click()}>Set Picture</button><button onClick={() => activeBannerRef.current?.click()}>Set Banner</button><button onClick={() => clearActiveProfileMedia("avatar")}>Clear Picture</button></div>
              <input ref={activeAvatarRef} type="file" accept="image/*" capture="user" onChange={(event) => handleActiveProfileMedia(event, "avatar")} hidden />
              <input ref={activeBannerRef} type="file" accept="image/*" onChange={(event) => handleActiveProfileMedia(event, "banner")} hidden />
            </article>
            <h3>Saved Personas</h3>
            <div className="personaList">
              {memory.personas.map((persona) => <article key={persona.id} className="personaCard">{persona.avatarData ? <img className="miniAvatar" src={persona.avatarData} alt={`${persona.displayName} avatar`} /> : <div className="miniAvatar placeholderAvatar">{persona.displayName.slice(0, 1)}</div>}<strong>{persona.displayName}</strong><span>{persona.personaTitle}</span><p>{persona.motto}</p><div className="cardActions"><button onClick={() => activatePersona(persona.id)}>Activate</button><button onClick={() => deletePersona(persona.id)}>Delete</button></div></article>)}
            </div>
          </div>
          <aside className="panel detailPanel">
            <h2>Create Custom Persona</h2>
            <form className="listingForm personaForm" onSubmit={createPersona}>
              <div className="mediaUploader profileMediaBuilder">
                <strong>Profile media</strong>
                <span>Add a profile picture and optional banner before creating the persona.</span>
                <div className="profilePreviewRow">
                  {profileDraft.avatarData ? <img className="profileAvatar" src={profileDraft.avatarData} alt="Persona avatar preview" /> : <div className="profileAvatar placeholderAvatar">+</div>}
                  {profileDraft.bannerData ? <figure className="profileBanner compactBanner"><img src={profileDraft.bannerData} alt="Persona banner preview" /></figure> : <div className="profileBanner emptyBanner"><span>Banner</span></div>}
                </div>
                <div className="cardActions"><button type="button" onClick={() => personaAvatarRef.current?.click()}>Picture</button><button type="button" onClick={() => personaBannerRef.current?.click()}>Banner</button></div>
                <input ref={personaAvatarRef} type="file" accept="image/*" capture="user" onChange={(event) => handlePersonaMedia(event, "avatar")} hidden />
                <input ref={personaBannerRef} type="file" accept="image/*" onChange={(event) => handlePersonaMedia(event, "banner")} hidden />
              </div>
              <input required placeholder="Display name" value={profileDraft.displayName} onChange={(event) => setProfileDraft({ ...profileDraft, displayName: event.target.value })} />
              <input placeholder="Persona title" value={profileDraft.personaTitle} onChange={(event) => setProfileDraft({ ...profileDraft, personaTitle: event.target.value })} />
              <input placeholder="Local zone" value={profileDraft.localZone} onChange={(event) => setProfileDraft({ ...profileDraft, localZone: event.target.value })} />
              <input placeholder="Seller style" value={profileDraft.sellerStyle} onChange={(event) => setProfileDraft({ ...profileDraft, sellerStyle: event.target.value })} />
              <input placeholder="Preferred deal type" value={profileDraft.preferredDeal} onChange={(event) => setProfileDraft({ ...profileDraft, preferredDeal: event.target.value })} />
              <input placeholder="Profile badge" value={profileDraft.badge} onChange={(event) => setProfileDraft({ ...profileDraft, badge: event.target.value })} />
              <textarea placeholder="Trust note" value={profileDraft.trustNote} onChange={(event) => setProfileDraft({ ...profileDraft, trustNote: event.target.value })} />
              <textarea placeholder="Core motto" value={profileDraft.motto} onChange={(event) => setProfileDraft({ ...profileDraft, motto: event.target.value })} />
              <button className="primaryButton" type="submit">Create Persona</button>
            </form>
          </aside>
        </section>
      )}

      {activeScreen === "history" && (
        <section className="panel widePanel">
          <div className="sectionHeader"><div><p className="eyebrow">Action History</p><h2>Every trust move in one place</h2></div><select className="compactSelect" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option>All</option><option>Action</option><option>Automation</option></select></div>
          <div className="historyTimeline">
            {filteredHistory.map((item) => <article key={`${item.source}-${item.id}`}><span className="badge">{item.source}</span><strong>{item.title}</strong><p>{item.description}</p><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "No timestamp"}</small></article>)}
            {filteredHistory.length === 0 && <p className="emptyState">No history matches this view yet.</p>}
          </div>
        </section>
      )}

      {activeScreen === "utilities" && (
        <section className="layoutGrid">
          <div className="panel widePanel">
            <div className="sectionHeader"><div><p className="eyebrow">Utilities + Pipeline</p><h2>Core Control Room</h2></div><div className="headerActions"><button className="primaryButton" onClick={saveEverything}>Save Everything</button><button onClick={toggleAutomation}>{memory.automation.enabled ? "Pause Automation" : "Start Automation"}</button></div></div>
            <section className="profileGrid">
              <Metric label="Listings Count" value={stats.listings} /><Metric label="Offers Count" value={stats.offers} /><Metric label="Saved CoreCards" value={stats.saved} /><Metric label="Completed Deals" value={stats.completedDeals} /><Metric label="Seller Box Requests" value={stats.sellerBoxes} /><Metric label="Interest Signals" value={stats.interestSignals} /><Metric label="Action History" value={stats.actions} /><Metric label="Verified Value Score" value={stats.verifiedValue} />
            </section>
            <h3>Offers & Trades</h3>
            <div className="offerList">
              {memory.offers.map((offer) => <article key={offer.id} className={offer.archived ? "offerCard archived" : "offerCard"}><div><span className="statusPill">{offer.status}</span>{offer.archived && <span className="statusPill archived-pill">Archived</span>}</div><h3>{offer.type} â€” {labelForListing(memory, offer.listingId)}</h3><p>{offer.message || "No message."}</p><div className="valueRow"><span>Amount: <strong>${offer.amount || "0"}</strong></span><span>Trade: <strong>{offer.tradeItem || "None"}</strong></span></div><div className="cardActions"><button onClick={() => updateOfferStatus(offer.id, "Active Negotiation", "offer_accepted")}>Accept</button><button onClick={() => updateOfferStatus(offer.id, "Counter Pending", "offer_countered")}>Counter</button><button onClick={() => updateOfferStatus(offer.id, "Closed / Declined", "offer_declined")}>Decline</button><button onClick={() => updateOfferStatus(offer.id, "Completed", "deal_completed")}>Complete Deal</button><button onClick={() => archiveOffer(offer.id, !offer.archived)}>{offer.archived ? "Restore" : "Archive"}</button></div></article>)}
              {memory.offers.length === 0 && <p className="emptyState">No offers yet. Open a CoreCard from Feed and create a Buy Offer or Trade Offer.</p>}
            </div>
            <h3>Deal Pipeline</h3>
            <div className="pipelineGrid"><PipelineColumn title="New CoreCards" items={pipeline.newCoreCards} field="title" /><PipelineColumn title="Interested" items={pipeline.interested} field="title" /><PipelineColumn title="Pending Offers" items={pipeline.pendingOffers} memory={memory} /><PipelineColumn title="Counter Pending" items={pipeline.counteredOffers} memory={memory} /><PipelineColumn title="Active Negotiation" items={pipeline.activeNegotiations} memory={memory} /><PipelineColumn title="Seller Box" items={pipeline.sellerBoxRequests} memory={memory} /><PipelineColumn title="Completed" items={pipeline.completedDeals} memory={memory} /><PipelineColumn title="Archived" items={pipeline.archivedOffers} memory={memory} /></div>
          </div>
          <aside className="panel detailPanel">
            <h2>Automation Rules</h2>
            <div className="automationRules">{Object.entries(memory.automation.rules).map(([rule, enabled]) => <button key={rule} className={enabled ? "ruleOn" : "ruleOff"} onClick={() => toggleRule(rule)}><span>{rule.replace(/([A-Z])/g, " $1")}</span><strong>{enabled ? "ON" : "OFF"}</strong></button>)}</div>
            <h2>Suggested Next Move</h2>
            <div className="suggestionStack">{suggestions.map((suggestion) => <p key={suggestion}>{suggestion}</p>)}</div>
            <h2>Saveability Checklist</h2>
            <div className="suggestionStack mediaChecklist">
              <p>{stats.mediaAssets > 0 ? "Media is stored in SellCore memory." : "Add one profile picture or listing photo."}</p>
              <p>{memory.listings.some((listing) => listing.imageData) ? "Feed output has listing images." : "Listing images are not present yet."}</p>
              <p>{memory.profile.avatarData ? "Active profile picture is visible and saveable." : "Active profile picture is empty."}</p>
              <p>{listingDraft.title || listingDraft.imageData ? "Listing draft is autosaved." : "Listing draft is empty."}</p>
              <p>{profileDraft.displayName || profileDraft.avatarData || profileDraft.bannerData ? "Profile draft is autosaved." : "Profile draft is empty."}</p>
              <p>Last full save: {lastFullSaveAt ? new Date(lastFullSaveAt).toLocaleString() : "Autosave only"}</p>
            </div>
            <h2>Private Board Outline</h2>
            <div className="messageOutline">
              {memory.messageBoardOutline.map((item) => <p key={item}>â€¢ {item}</p>)}
            </div>
            <h2>Memory Guard</h2>
            <div className="memoryControls"><button className="primaryButton" onClick={saveEverything}>Save Everything</button><button onClick={exportMemory}>Export Full Save Backup</button><button onClick={() => importRef.current?.click()}>Import Full Save Backup</button><button onClick={resetDemoMemory}>Reset Demo Memory</button><input ref={importRef} type="file" accept="application/json,.json" onChange={handleImportFile} hidden /></div>
          </aside>
        </section>
      )}

      <nav className="bottomIconNav" aria-label="SellCore bottom navigation">
        {BOTTOM_NAV.filter((item) => !["history", "utilities"].includes(item.id)).map((item) => <button key={item.id} className={activeScreen === item.id ? "active" : ""} onClick={() => setActiveScreen(item.id)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}
      </nav>
    </main>
  );
}

function PipelineColumn({ title, items, field = "status", memory }) {
  return (
    <article className="pipelineColumn">
      <strong>{title}</strong>
      <span>{items.length}</span>
      {items.slice(0, 3).map((item) => (
        <p key={item.id}>{field === "title" ? item.title : item.title || labelForListing(memory, item.listingId)}</p>
      ))}
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default App;

