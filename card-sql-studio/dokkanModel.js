const STORAGE_KEYS = {
  localIdCounter: "dokkan_patcher_local_id_counter",
  cardsState: "card-sql-studio.legacy.patchState",
};
const memoryStorage = new Map();

function storageGet(key) {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}

function storageSet(key, value) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }
  memoryStorage.set(key, value);
}

function storageRemove(key) {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }
  memoryStorage.delete(key);
}

const LOCAL_ID_START_RANGE = 109000;
const LOCAL_ID_END_RANGE = 1999999;

const UR_RARITY_DEFAULTS = {
  lv_max: 120,
  skill_lv_max: 10,
  grow_type: 41,
  price: 29466,
  exp_type: 15,
  training_exp: 6045,
  eball_mod_min: 50,
  eball_mod_num100: 4,
  eball_mod_mid: 0,
  eball_mod_mid_num: 0,
  eball_mod_max: 150,
  eball_mod_max_num: 12,
};

const LR_RARITY_DEFAULTS = {
  lv_max: 150,
  skill_lv_max: 20,
  grow_type: 50,
  price: 50176,
  exp_type: 25,
  training_exp: 7980,
  eball_mod_min: 40,
  eball_mod_num100: 3,
  eball_mod_mid: 145,
  eball_mod_mid_num: 12,
  eball_mod_max: 200,
  eball_mod_max_num: 24,
};

export const RARITY_OPTIONS = [
  { value: 3, label: "SSR (3)" },
  { value: 4, label: "UR (4)" },
  { value: 5, label: "LR (5)" },
];

export const ELEMENT_OPTIONS = [
  { value: 0, label: "AGL (0)" },
  { value: 1, label: "TEQ (1)" },
  { value: 2, label: "INT (2)" },
  { value: 3, label: "STR (3)" },
  { value: 4, label: "PHY (4)" },
  { value: 10, label: "Super AGL (10)" },
  { value: 11, label: "Super TEQ (11)" },
  { value: 12, label: "Super INT (12)" },
  { value: 13, label: "Super STR (13)" },
  { value: 14, label: "Super PHY (14)" },
  { value: 20, label: "Extreme AGL (20)" },
  { value: 21, label: "Extreme TEQ (21)" },
  { value: 22, label: "Extreme INT (22)" },
  { value: 23, label: "Extreme STR (23)" },
  { value: 24, label: "Extreme PHY (24)" },
];

export const DOKKAN_TABLE_COLUMNS = {
  characters: ["id", "name", "race", "sex", "size", "created_at", "updated_at"],
  cards: [
    "id",
    "name",
    "character_id",
    "card_unique_info_id",
    "cost",
    "rarity",
    "hp_init",
    "hp_max",
    "atk_init",
    "atk_max",
    "def_init",
    "def_max",
    "element",
    "lv_max",
    "skill_lv_max",
    "grow_type",
    "optimal_awakening_grow_type",
    "price",
    "exp_type",
    "training_exp",
    "special_motion",
    "passive_skill_set_id",
    "leader_skill_set_id",
    "link_skill1_id",
    "link_skill2_id",
    "link_skill3_id",
    "link_skill4_id",
    "link_skill5_id",
    "link_skill6_id",
    "link_skill7_id",
    "eball_mod_min",
    "eball_mod_num100",
    "eball_mod_mid",
    "eball_mod_mid_num",
    "eball_mod_max",
    "eball_mod_max_num",
    "max_level_reward_id",
    "max_level_reward_type",
    "collectable_type",
    "face_x",
    "face_y",
    "aura_id",
    "aura_scale",
    "aura_offset_x",
    "aura_offset_y",
    "is_aura_front",
    "is_selling_only",
    "awakening_number",
    "resource_id",
    "bg_effect_id",
    "selling_exchange_point",
    "awakening_element_type",
    "potential_board_id",
    "open_at",
    "created_at",
    "updated_at",
  ],
  card_unique_infos: ["id", "name", "kana", "created_at", "updated_at"],
  card_card_categories: ["id", "card_id", "card_category_id", "num", "created_at", "updated_at"],
  passive_skill_sets: ["id", "name", "itemized_description", "created_at", "updated_at"],
  leader_skill_sets: ["id", "name", "description", "created_at", "updated_at"],
  special_sets: [
    "id",
    "name",
    "description",
    "causality_description",
    "aim_target",
    "increase_rate",
    "lv_bonus",
    "is_inactive",
    "created_at",
    "updated_at",
  ],
  card_specials: [
    "id",
    "card_id",
    "special_set_id",
    "priority",
    "style",
    "lv_start",
    "eball_num_start",
    "view_id",
    "card_costume_condition_id",
    "special_bonus_id1",
    "special_bonus_lv1",
    "bonus_view_id1",
    "special_bonus_id2",
    "special_bonus_lv2",
    "bonus_view_id2",
    "causality_conditions",
    "special_asset_id",
    "created_at",
    "updated_at",
  ],
  active_skill_sets: [
    "id",
    "name",
    "effect_description",
    "condition_description",
    "turn",
    "exec_limit",
    "causality_conditions",
    "ultimate_special_id",
    "special_view_id",
    "costume_special_view_id",
    "bgm_id",
    "created_at",
    "updated_at",
  ],
  active_skills: [
    "id",
    "active_skill_set_id",
    "target_type",
    "sub_target_type_set_id",
    "calc_option",
    "efficacy_type",
    "eff_val1",
    "eff_val2",
    "eff_val3",
    "efficacy_values",
    "thumb_effect_id",
    "effect_se_id",
    "created_at",
    "updated_at",
  ],
  card_active_skills: ["id", "card_id", "active_skill_set_id", "created_at", "updated_at"],
  standby_skill_sets: [
    "id",
    "name",
    "ingame_icon_path",
    "effect_description",
    "condition_description",
    "exec_limit",
    "causality_conditions",
    "special_view_id",
    "costume_special_view_id",
    "bgm_id",
    "created_at",
    "updated_at",
  ],
  card_standby_skill_set_relations: [
    "id",
    "card_id",
    "standby_skill_set_id",
    "created_at",
    "updated_at",
  ],
};

function getInitialCounter() {
  const raw = storageGet(STORAGE_KEYS.localIdCounter);
  return raw ? Number.parseInt(raw, 10) : 0;
}

export function generateLocalId() {
  const current = getInitialCounter();
  const nextId = LOCAL_ID_START_RANGE + current;
  if (nextId > LOCAL_ID_END_RANGE) {
    console.warn("Local ID counter exceeded expected range.");
  }
  storageSet(STORAGE_KEYS.localIdCounter, String(current + 1));
  return String(nextId);
}

export function createInitialCardForm() {
  return {
    id: "",
    name: "",
    character_id: "",
    card_unique_info_id: "",
    cost: 0,
    rarity: 4,
    hp_init: 0,
    hp_max: 0,
    atk_init: 0,
    atk_max: 0,
    def_init: 0,
    def_max: 0,
    element: 0,
    ...UR_RARITY_DEFAULTS,
    special_motion: 0,
    passive_skill_set_id: "",
    leader_skill_set_id: "",
    link_skill_ids: Array(7).fill(""),
    category_ids: [],
    max_level_reward_id: "1",
    max_level_reward_type: "1",
    collectable_type: 1,
    face_x: 0,
    face_y: 0,
    aura_id: null,
    is_selling_only: 0,
    awakening_element_type: null,
    potential_board_id: null,
    optimal_awakening_grow_type: null,
    active_skill_set_id_ref: "",
    standby_skill_set_id_ref: "",
  };
}

function createInitialCharacter(id) {
  return {
    id,
    name: "",
    race: "0",
    sex: "0",
    size: "0",
  };
}

function createInitialCardSpecial(cardId, specialSetId) {
  return {
    id: generateLocalId(),
    card_id: cardId,
    special_set_id: specialSetId,
    priority: 0,
    style: "Normal",
    lv_start: 1,
    eball_num_start: 12,
    view_id: 0,
    card_costume_condition_id: 0,
    special_bonus_id1: 0,
    special_bonus_lv1: 0,
    bonus_view_id1: 0,
    special_bonus_id2: 0,
    special_bonus_lv2: 0,
    bonus_view_id2: 0,
    causality_conditions: null,
    special_asset_id: null,
  };
}

function createInitialActiveSkillEffect(activeSkillSetId) {
  return {
    id: `${activeSkillSetId}1`,
    active_skill_set_id: activeSkillSetId,
    target_type: 1,
    efficacy_type: 1,
    calc_option: 2,
    eff_val1: 0,
    eff_val2: 0,
    eff_val3: 0,
    efficacy_values: "{}",
    sub_target_type_set_id: null,
    thumb_effect_id: null,
    effect_se_id: null,
  };
}

function applyRarityDefaults(card, rarity) {
  if (rarity === 5) {
    return { ...card, ...LR_RARITY_DEFAULTS };
  }
  if (rarity === 4) {
    return { ...card, ...UR_RARITY_DEFAULTS };
  }
  return card;
}

export function createCardBundle() {
  const cardId = generateLocalId();
  const uniqueInfoId = `10${cardId}`;
  const passiveSetId = cardId;
  const leaderSetId = cardId;
  const activeSetId = cardId;
  const standbySetId = cardId;
  const specialSetId = cardId;
  const characterId = generateLocalId();

  const seededCard = applyRarityDefaults(
    {
      ...createInitialCardForm(),
      id: cardId,
      name: `New Card ${cardId}`,
      character_id: characterId,
      card_unique_info_id: uniqueInfoId,
      passive_skill_set_id: passiveSetId,
      leader_skill_set_id: leaderSetId,
      active_skill_set_id_ref: activeSetId,
      standby_skill_set_id_ref: standbySetId,
    },
    4
  );

  return {
    cardForm: seededCard,
    cardUniqueInfo: {
      id: uniqueInfoId,
      name: `Character Name for ${cardId}`,
      kana: null,
    },
    character: {
      ...createInitialCharacter(characterId),
      name: `Character ${cardId}`,
    },
    passiveSkillSet: {
      id: passiveSetId,
      name: `Passive for ${cardId}`,
      itemized_description: null,
      skills: [],
    },
    leaderSkillSet: {
      id: leaderSetId,
      name: `Leader for ${cardId}`,
      description: null,
      skills: [],
    },
    specialSet: {
      id: specialSetId,
      name: `Special for ${cardId}`,
      description: null,
      causality_description: null,
      aim_target: 0,
      increase_rate: 180,
      lv_bonus: 25,
      is_inactive: 0,
      skills: [],
    },
    activeSkillSet: {
      id: activeSetId,
      name: `Active for ${cardId}`,
      effect_description: "",
      condition_description: "",
      turn: 1,
      exec_limit: 1,
      causality_conditions: null,
      ultimate_special_id: null,
      special_view_id: null,
      costume_special_view_id: 0,
      bgm_id: null,
      skills: [createInitialActiveSkillEffect(activeSetId)],
    },
    standbySkillSet: {
      id: standbySetId,
      name: `Standby for ${cardId}`,
      ingame_icon_path: "",
      effect_description: "",
      condition_description: "",
      exec_limit: 1,
      causality_conditions: null,
      special_view_id: null,
      costume_special_view_id: 0,
      bgm_id: null,
      skills: [],
    },
    cardSpecial: createInitialCardSpecial(cardId, specialSetId),
    cardActiveSkill: {
      id: `${cardId}${activeSetId}`,
      card_id: cardId,
      active_skill_set_id: activeSetId,
    },
    cardStandbySkill: {
      id: `${cardId}${standbySetId}`,
      card_id: cardId,
      standby_skill_set_id: standbySetId,
    },
  };
}

export function createInitialPatchState() {
  return {
    cardForms: [],
    cardUniqueInfos: [],
    characters: [],
    passiveSkillSets: [],
    leaderSkillSets: [],
    specialSets: [],
    activeSkillSets: [],
    standbySkillSets: [],
    cardSpecials: [],
    cardActiveSkills: [],
    cardStandbySkills: [],
    isEZA: false,
  };
}

export function savePatchState(state) {
  storageSet(STORAGE_KEYS.cardsState, JSON.stringify(state));
}

export function loadPatchState() {
  try {
    const raw = storageGet(STORAGE_KEYS.cardsState);
    if (!raw) {
      return createInitialPatchState();
    }
    const parsed = JSON.parse(raw);
    return { ...createInitialPatchState(), ...parsed };
  } catch (error) {
    console.error("Failed to parse saved patch state", error);
    return createInitialPatchState();
  }
}

export function clearPatchStateStorage() {
  storageRemove(STORAGE_KEYS.cardsState);
}

export function parseCsvIds(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toCsv(ids) {
  return Array.isArray(ids) ? ids.filter(Boolean).join(", ") : "";
}

export function applyCardRarityDefaults(cardForm) {
  const rarity = Number(cardForm.rarity || 4);
  return applyRarityDefaults(cardForm, rarity);
}
