import initSqlJs, { type Database, QueryExecResult } from 'sql.js';
import {
  DokkanID,
  CardBasicInfo,
  DokkanPatchState,
  CardForm,
  CardUniqueInfo,
  PassiveSkillSet,
  LeaderSkillSet,
  SpecialSet,
  Special,
  ActiveSkillSet,
  ActiveSkillEffect,
  PassiveSkill,
  LeaderSkill,
  CardSpecial,
  CardActiveSkill,
  OptimalAwakeningGrowth,
  StandbySkillSet,
  StandbySkill,
  CardStandbySkill,
  FinishSkillSet,
  FinishSkill,
  StandbySkillSetFinishSkillSetRelation,
  FinishSpecial,
  BattleParam,
  PassiveSkillEffectEntry,
  EffectPackEntry,
  TargetSkillSetType,
  AnySkillSet,
  AnySkill,
  CardDBRow,
  PlannedCard,
  SkillCausality,
  SpecialView,
} from '../types';
import {
  INITIAL_CARD_FORM,
  generateLocalId,
  INITIAL_CARD_SPECIAL,
  ID_PREFIXES,
  INITIAL_PASSIVE_SKILL,
  INITIAL_LEADER_SKILL,
  INITIAL_SPECIAL_SKILL,
  INITIAL_ACTIVE_SKILL_EFFECT,
  INITIAL_STANDBY_SKILL,
  UR_RARITY_DEFAULTS,
  LR_RARITY_DEFAULTS,
} from '../constants';

let SQL: initSqlJs.SqlJsStatic | null = null;

const initializeSqlJs = async (): Promise<initSqlJs.SqlJsStatic> => {
  if (!SQL) {
    try {
      SQL = await initSqlJs({
        locateFile: (file) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`,
      });
    } catch (error) {
      console.error('Failed to initialize sql.js:', error);
      throw new Error(
        'Failed to initialize SQL.js. Check network connection or browser compatibility.'
      );
    }
  }
  return SQL;
};

export const loadDatabase = async (file: File): Promise<Database> => {
  const sqlJsStatic = await initializeSqlJs();
  const fileBuffer = await file.arrayBuffer();
  try {
    return new sqlJsStatic.Database(new Uint8Array(fileBuffer));
  } catch (error) {
    console.error('Error creating database from file buffer:', error);
    throw new Error('Invalid or corrupted database file.');
  }
};

const resultsToObjects = (results: QueryExecResult[]): Record<string, any>[] => {
  if (!results || results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

export const searchCharactersByName = async (
  db: Database,
  nameQuery: string,
  elementFilter: number | null,
  rarityFilter: number | null,
  idFilter: 'all' | 'base' | 'transformed',
  categoryFilter: string[] | null,
  linkSkillFilter: string[] | null
): Promise<CardBasicInfo[]> => {
  const hasNameQuery = nameQuery.trim().length > 0;
  const hasOtherFilters =
    elementFilter !== null ||
    rarityFilter !== null ||
    idFilter !== 'all' ||
    (categoryFilter && categoryFilter.length > 0) ||
    (linkSkillFilter && linkSkillFilter.length > 0);

  if (!hasNameQuery && !hasOtherFilters) return [];

  let query = `
    SELECT c.id, c.name, c.rarity, c.element 
    FROM cards c
  `;
  const params: (string | number)[] = [];
  const whereClauses: string[] = [];

  if (categoryFilter && categoryFilter.length > 0) {
    query += `
        JOIN card_card_categories ccc ON c.id = ccc.card_id
      `;
    const placeholders = categoryFilter.map(() => '?').join(',');
    whereClauses.push(`ccc.card_category_id IN (${placeholders})`);
    categoryFilter.forEach((catId) => params.push(catId));
  }

  if (hasNameQuery) {
    whereClauses.push('(c.name LIKE ? OR c.id LIKE ?)');
    params.push(`%${nameQuery}%`, `${nameQuery}%`);
  }

  if (elementFilter !== null) {
    const baseElement = elementFilter % 10;
    if (elementFilter < 10) {
      whereClauses.push('(c.element = ? OR c.element = ? OR c.element = ?)');
      params.push(baseElement, baseElement + 10, baseElement + 20);
    } else {
      whereClauses.push('c.element = ?');
      params.push(elementFilter);
    }
  }

  if (rarityFilter !== null) {
    whereClauses.push('c.rarity = ?');
    params.push(rarityFilter);
  }

  if (idFilter === 'base') {
    whereClauses.push("SUBSTR(c.id, 1, 1) = '1'");
  } else if (idFilter === 'transformed') {
    whereClauses.push("SUBSTR(c.id, 1, 1) != '1'");
  }

  if (linkSkillFilter && linkSkillFilter.length > 0) {
    linkSkillFilter.forEach((linkId) => {
      whereClauses.push(
        `? IN (c.link_skill1_id, c.link_skill2_id, c.link_skill3_id, c.link_skill4_id, c.link_skill5_id, c.link_skill6_id, c.link_skill7_id)`
      );
      params.push(linkId);
    });
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (categoryFilter && categoryFilter.length > 0) {
    query += `
        GROUP BY c.id, c.name, c.rarity, c.element
        HAVING COUNT(DISTINCT ccc.card_category_id) = ?
      `;
    params.push(categoryFilter.length);
  }

  query += `
    ORDER BY c.name ASC, c.id ASC
    LIMIT 200; 
  `;

  try {
    const dbResults = db.exec(query, params);
    const initialResults = resultsToObjects(dbResults).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      rarity: Number(row.rarity),
      element: Number(row.element),
    })) as CardBasicInfo[];

    const candidates = new Map<string, CardBasicInfo>();

    for (const card of initialResults) {
      const idStr = card.id;
      if (idStr.length > 1) {
        const basePart = idStr.substring(0, idStr.length - 1);
        const suffix = idStr.substring(idStr.length - 1);

        if (suffix === '1') {
          candidates.set(basePart, card);
        } else if (suffix === '0') {
          if (!candidates.has(basePart)) {
            candidates.set(basePart, card);
          }
        } else {
          if (!candidates.has(idStr)) {
            candidates.set(idStr, card);
          }
        }
      } else {
        if (!candidates.has(idStr)) {
          candidates.set(idStr, card);
        }
      }
    }

    const finalDisplayList = Array.from(candidates.values())
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      })
      .slice(0, 50);

    return finalDisplayList;
  } catch (e) {
    console.error('DB search error:', e);
    throw new Error('Failed to search characters in the database.');
  }
};

const getVal = <T>(val: any, defaultVal: T): T =>
  val !== null && val !== undefined ? val : defaultVal;

const mapDbRowToOag = (dbRow: Record<string, any>): OptimalAwakeningGrowth => ({
  id: String(dbRow.id),
  optimal_awakening_grow_type: String(dbRow.optimal_awakening_grow_type),
  step: getVal(dbRow.step, 0),
  lv_max: getVal(dbRow.lv_max, 0),
  skill_lv_max: getVal(dbRow.skill_lv_max, 0),
  passive_skill_set_id: String(dbRow.passive_skill_set_id),
  leader_skill_set_id: String(dbRow.leader_skill_set_id),
});

const mapDbRowToCardForm = (dbRow: CardDBRow): CardForm => {
  // Fix: Explicitly type `rarity` as a number to prevent TypeScript from inferring it as a literal type (4), which caused a comparison error.
  const rarity: number = getVal(dbRow.rarity, 4);
  const rarityDefaults = rarity === 5 ? LR_RARITY_DEFAULTS : UR_RARITY_DEFAULTS;

  return {
    ...INITIAL_CARD_FORM(),
    ...rarityDefaults,
    id: String(dbRow.id),
    name: getVal(dbRow.name, ''),
    character_id: String(dbRow.character_id),
    card_unique_info_id: String(dbRow.card_unique_info_id),
    cost: getVal(dbRow.cost, 0),
    rarity: rarity,
    hp_init: getVal(dbRow.hp_init, 0),
    hp_max: getVal(dbRow.hp_max, 0),
    atk_init: getVal(dbRow.atk_init, 0),
    atk_max: getVal(dbRow.atk_max, 0),
    def_init: getVal(dbRow.def_init, 0),
    def_max: getVal(dbRow.def_max, 0),
    element: getVal(dbRow.element, 0),
    lv_max: getVal(dbRow.lv_max, rarityDefaults.lv_max),
    skill_lv_max: getVal(dbRow.skill_lv_max, rarityDefaults.skill_lv_max),
    grow_type: getVal(dbRow.grow_type, rarityDefaults.grow_type),
    price: getVal(dbRow.price, rarityDefaults.price),
    exp_type: getVal(dbRow.exp_type, rarityDefaults.exp_type),
    training_exp: getVal(dbRow.training_exp, rarityDefaults.training_exp),
    special_motion: getVal(dbRow.special_motion, 0),
    passive_skill_set_id: String(dbRow.passive_skill_set_id || ''),
    leader_skill_set_id: String(dbRow.leader_skill_set_id || ''),
    link_skill_ids: [
      dbRow.link_skill1_id,
      dbRow.link_skill2_id,
      dbRow.link_skill3_id,
      dbRow.link_skill4_id,
      dbRow.link_skill5_id,
      dbRow.link_skill6_id,
      dbRow.link_skill7_id,
    ]
      .map((id) => String(id || ''))
      .filter((id) => id && id !== 'null' && id.trim() !== '' && id.trim() !== '0'),
    category_ids: [], // This will be populated by the calling function
    eball_mod_min: getVal(dbRow.eball_mod_min, rarityDefaults.eball_mod_min),
    eball_mod_num100: getVal(dbRow.eball_mod_num100, rarityDefaults.eball_mod_num100),
    eball_mod_mid: getVal(dbRow.eball_mod_mid, rarityDefaults.eball_mod_mid),
    eball_mod_mid_num: getVal(dbRow.eball_mod_mid_num, rarityDefaults.eball_mod_mid_num),
    eball_mod_max: getVal(dbRow.eball_mod_max, rarityDefaults.eball_mod_max),
    eball_mod_max_num: getVal(dbRow.eball_mod_max_num, rarityDefaults.eball_mod_max_num),
    max_level_reward_id: String(dbRow.max_level_reward_id || '1'),
    max_level_reward_type: String(dbRow.max_level_reward_type || '1'),
    collectable_type: getVal(dbRow.collectable_type, 1),
    face_x: getVal(dbRow.face_x, 0),
    face_y: getVal(dbRow.face_y, 0),
    aura_id: dbRow.aura_id ? String(dbRow.aura_id) : null,
    is_selling_only: getVal(dbRow.is_selling_only, 0),
    awakening_element_type: dbRow.awakening_element_type,
    potential_board_id: dbRow.potential_board_id ? String(dbRow.potential_board_id) : null,
    optimal_awakening_grow_type: dbRow.optimal_awakening_grow_type
      ? String(dbRow.optimal_awakening_grow_type)
      : null,
    active_skill_set_id_ref: '',
    standby_skill_set_id_ref: '',
  };
};

export const checkCharacterEZA = async (
  db: Database,
  cardId: DokkanID
): Promise<OptimalAwakeningGrowth | null> => {
  try {
    const cardRes = db.exec('SELECT optimal_awakening_grow_type FROM cards WHERE id = ?', [cardId]);
    const cardRow = resultsToObjects(cardRes)[0];

    if (!cardRow || !cardRow.optimal_awakening_grow_type) return null;

    const oagTypeFromCard = String(cardRow.optimal_awakening_grow_type);
    // Ensure the ID used for lookup ends in '0' to handle DB inconsistencies
    const canonicalOagType = oagTypeFromCard.slice(0, -1) + '0';

    const oagRes = db.exec(
      'SELECT * FROM optimal_awakening_growths WHERE optimal_awakening_grow_type = ? ORDER BY step DESC LIMIT 1',
      [canonicalOagType]
    );
    const oagRow = resultsToObjects(oagRes)[0];

    if (!oagRow) return null;

    const oagObject = mapDbRowToOag(oagRow);
    // Also ensure the returned object itself has the canonical type, regardless of what's in the DB row
    oagObject.optimal_awakening_grow_type = canonicalOagType;

    return oagObject;
  } catch (e) {
    console.error(`Error checking EZA for card ${cardId}:`, e);
    return null;
  }
};

const mapDbRowToPassiveSkill = (dbRow: Record<string, any>): PassiveSkill => ({
  id: String(dbRow.id),
  name: getVal(dbRow.name, ''),
  description: getVal(dbRow.description, ''),
  exec_timing_type: getVal(dbRow.exec_timing_type, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id
    ? String(dbRow.sub_target_type_set_id)
    : null,
  passive_skill_effect_id: dbRow.passive_skill_effect_id
    ? String(dbRow.passive_skill_effect_id)
    : null,
  calc_option: getVal(dbRow.calc_option, 0),
  turn: getVal(dbRow.turn, 0),
  is_once: getVal(dbRow.is_once, 0),
  probability: getVal(dbRow.probability, 100),
  causality_conditions: dbRow.causality_conditions ? String(dbRow.causality_conditions) : null,
  eff_value1: dbRow.eff_value1,
  eff_value2: dbRow.eff_value2,
  eff_value3: dbRow.eff_value3,
  efficacy_values: getVal(dbRow.efficacy_values, '{}'),
});

const mapDbRowToLeaderSkill = (
  dbRow: Record<string, any>,
  leader_skill_set_id: DokkanID
): LeaderSkill => ({
  id: String(dbRow.id),
  leader_skill_set_id: leader_skill_set_id,
  exec_timing_type: getVal(dbRow.exec_timing_type, 0),
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id
    ? String(dbRow.sub_target_type_set_id)
    : null,
  causality_conditions: dbRow.causality_conditions ? String(dbRow.causality_conditions) : null,
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  efficacy_values: getVal(dbRow.efficacy_values, '[]'),
  calc_option: getVal(dbRow.calc_option, 0),
});

const mapDbRowToSpecial = (dbRow: Record<string, any>, special_set_id: DokkanID): Special => ({
  id: String(dbRow.id),
  special_set_id: special_set_id,
  type: getVal(dbRow.type, 'Special::NormalEfficacySpecial'),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  target_type: getVal(dbRow.target_type, 0),
  calc_option: getVal(dbRow.calc_option, 0),
  turn: getVal(dbRow.turn, 1),
  prob: getVal(dbRow.prob, 100),
  causality_conditions: dbRow.causality_conditions ? String(dbRow.causality_conditions) : null,
  eff_value1: dbRow.eff_value1,
  eff_value2: dbRow.eff_value2,
  eff_value3: dbRow.eff_value3,
});

const mapDbRowToActiveSkillEffect = (
  dbRow: Record<string, any>,
  active_skill_set_id: DokkanID
): ActiveSkillEffect => ({
  id: String(dbRow.id),
  active_skill_set_id: active_skill_set_id,
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id
    ? String(dbRow.sub_target_type_set_id)
    : null,
  calc_option: getVal(dbRow.calc_option, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  eff_val1: dbRow.eff_val1,
  eff_val2: dbRow.eff_val2,
  eff_val3: dbRow.eff_val3,
  efficacy_values: getVal(dbRow.efficacy_values, '{}'),
  thumb_effect_id: dbRow.thumb_effect_id ? Number(dbRow.thumb_effect_id) : null,
  effect_se_id: dbRow.effect_se_id ? Number(dbRow.effect_se_id) : null,
});

const mapDbRowToCardSpecial = (dbRow: Record<string, any>): CardSpecial => ({
  id: String(dbRow.id),
  card_id: String(dbRow.card_id),
  special_set_id: String(dbRow.special_set_id),
  priority: getVal(dbRow.priority, 0),
  style: getVal(dbRow.style, 'Normal'),
  lv_start: getVal(dbRow.lv_start, INITIAL_CARD_SPECIAL('', '').lv_start),
  eball_num_start: getVal(dbRow.eball_num_start, INITIAL_CARD_SPECIAL('', '').eball_num_start),
  view_id: getVal(dbRow.view_id, 0),
  card_costume_condition_id: getVal(dbRow.card_costume_condition_id, 0),
  special_bonus_id1: getVal(dbRow.special_bonus_id1, 0),
  special_bonus_lv1: getVal(dbRow.special_bonus_lv1, 0),
  bonus_view_id1: getVal(dbRow.bonus_view_id1, 0),
  special_bonus_id2: getVal(dbRow.special_bonus_id2, 0),
  special_bonus_lv2: getVal(dbRow.special_bonus_lv2, 0),
  bonus_view_id2: getVal(dbRow.bonus_view_id2, 0),
  causality_conditions: dbRow.causality_conditions ? String(dbRow.causality_conditions) : null,
  special_asset_id: dbRow.special_asset_id ? String(dbRow.special_asset_id) : null,
});

const mapDbRowToStandbySkill = (
  dbRow: Record<string, any>,
  standby_skill_set_id: DokkanID
): StandbySkill => ({
  id: String(dbRow.id),
  standby_skill_set_id,
  target_type: getVal(dbRow.target_type, 0),
  target_type_values: getVal(dbRow.target_type_values, '{}'),
  sub_target_type_set_id: dbRow.sub_target_type_set_id
    ? String(dbRow.sub_target_type_set_id)
    : null,
  turn: getVal(dbRow.turn, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  calc_option: dbRow.calc_option ? String(dbRow.calc_option) : null,
  efficacy_values: getVal(dbRow.efficacy_values, '{}'),
  thumb_effect_id: dbRow.thumb_effect_id ? String(dbRow.thumb_effect_id) : null,
  effect_se_id: dbRow.effect_se_id ? String(dbRow.effect_se_id) : null,
});

const mapDbRowToFinishSkill = (
  dbRow: Record<string, any>,
  finish_skill_set_id: DokkanID
): FinishSkill => ({
  id: String(dbRow.id),
  finish_skill_set_id,
  target_type: getVal(dbRow.target_type, 0),
  target_type_values: getVal(dbRow.target_type_values, '{}'),
  sub_target_type_set_id: dbRow.sub_target_type_set_id
    ? String(dbRow.sub_target_type_set_id)
    : null,
  turn: getVal(dbRow.turn, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  calc_option: dbRow.calc_option ? String(dbRow.calc_option) : null,
  efficacy_values: getVal(dbRow.efficacy_values, '{}'),
  thumb_effect_id: dbRow.thumb_effect_id ? String(dbRow.thumb_effect_id) : null,
  effect_se_id: dbRow.effect_se_id ? String(dbRow.effect_se_id) : null,
});

const mapDbRowToPassiveSkillEffect = (dbRow: Record<string, any>): PassiveSkillEffectEntry => ({
  id: String(dbRow.id), // Ensure ID is string
  script_name: getVal(dbRow.script_name, ''),
  lite_flicker_rate: getVal(dbRow.lite_flicker_rate, 0),
  bgm_id: dbRow.bgm_id ? Number(dbRow.bgm_id) : null,
});

const mapDbRowToEffectPack = (dbRow: Record<string, any>): EffectPackEntry => ({
  id: String(dbRow.id), // Ensure ID is string
  category: getVal(dbRow.category, 0),
  name: getVal(dbRow.name, ''),
  pack_name: getVal(dbRow.pack_name, ''),
  scene_name: getVal(dbRow.scene_name, ''),
  red: getVal(dbRow.red, 0),
  green: getVal(dbRow.green, 0),
  blue: getVal(dbRow.blue, 0),
  alpha: getVal(dbRow.alpha, 0),
  lite_flicker_rate: getVal(dbRow.lite_flicker_rate, 0),
});

const mapDbRowToSkillCausality = (dbRow: Record<string, any>): SkillCausality => ({
  id: String(dbRow.id),
  causality_type: getVal(dbRow.causality_type, 0),
  cau_val1: getVal(dbRow.cau_val1, 0),
  cau_val2: getVal(dbRow.cau_val2, 0),
  cau_val3: getVal(dbRow.cau_val3, 0),
});

export const getCharacterDetails = async (
  db: Database,
  initialSelectedCardId: DokkanID,
  options: { loadEza: boolean }
): Promise<DokkanPatchState | null> => {
  // --- 1. SETUP ---
  const allCardForms: CardForm[] = [];
  const allCardUniqueInfos = new Map<DokkanID, CardUniqueInfo>();
  const allPassiveSkillSets = new Map<DokkanID, PassiveSkillSet>();
  const allLeaderSkillSets = new Map<DokkanID, LeaderSkillSet>();
  const allSpecialSets = new Map<DokkanID, SpecialSet>();
  const allActiveSkillSets = new Map<DokkanID, ActiveSkillSet>();
  const allStandbySkillSets = new Map<DokkanID, StandbySkillSet>();
  const allFinishSkillSets = new Map<DokkanID, FinishSkillSet>();
  const allPassiveSkillEffects = new Map<DokkanID, PassiveSkillEffectEntry>();
  const allEffectPacks = new Map<DokkanID, EffectPackEntry>();

  const allCardSpecials: CardSpecial[] = [];
  const allCardActiveSkills: CardActiveSkill[] = [];
  const allCardStandbySkills: CardStandbySkill[] = [];
  const allStandbySkillSetFinishSkillSetRelations: StandbySkillSetFinishSkillSetRelation[] = [];
  const allFinishSpecials: FinishSpecial[] = [];
  const allBattleParams: BattleParam[] = [];
  const allSkillCausalities: SkillCausality[] = [];
  const visitedCausalityIds = new Set<DokkanID>();

  let ezaDetails: {
    isEZA: boolean;
    baseCardIdForEZA?: DokkanID;
    optimalAwakeningGrowth?: OptimalAwakeningGrowth;
  } = { isEZA: false };

  // --- 2. EZA PRE-PROCESSING ---
  const nonEzaPassiveIdsToSkip = new Set<DokkanID>();
  const nonEzaLeaderIdsToSkip = new Set<DokkanID>();
  const nonEzaSpecialSetIdsToSkip = new Set<DokkanID>();

  if (options.loadEza) {
    const ezaInfo = await checkCharacterEZA(db, initialSelectedCardId);
    if (ezaInfo) {
      ezaDetails = {
        isEZA: true,
        baseCardIdForEZA: initialSelectedCardId,
        optimalAwakeningGrowth: ezaInfo,
      };

      const cardsToCheckForPreEzaSkills = new Set<DokkanID>([initialSelectedCardId]);
      const idPrefix = initialSelectedCardId.slice(0, -1);
      const otherSuffix = initialSelectedCardId.endsWith('0') ? '1' : '0';
      cardsToCheckForPreEzaSkills.add(idPrefix + otherSuffix);

      for (const cardId of cardsToCheckForPreEzaSkills) {
        const cardRow = await getCardRowById(db, cardId);
        if (cardRow) {
          if (cardRow.passive_skill_set_id)
            nonEzaPassiveIdsToSkip.add(String(cardRow.passive_skill_set_id));
          if (cardRow.leader_skill_set_id)
            nonEzaLeaderIdsToSkip.add(String(cardRow.leader_skill_set_id));

          const cardSpecialRows = resultsToObjects(
            db.exec('SELECT special_set_id, lv_start FROM card_specials WHERE card_id = ?', [
              cardId,
            ])
          );
          const preEzaSpecials = cardSpecialRows.filter((row) => row.lv_start <= 10);
          preEzaSpecials.forEach((row) =>
            nonEzaSpecialSetIdsToSkip.add(String(row.special_set_id))
          );
        }
      }
    }
  }

  // --- 3. FETCHING LOGIC ---
  const fetchQueue = new Set<DokkanID>([initialSelectedCardId]);
  const visitedCardIds = new Set<DokkanID>();

  const idPrefix = initialSelectedCardId.slice(0, -1);
  const suffix = initialSelectedCardId.slice(-1);
  if (!isNaN(parseInt(suffix))) {
    fetchQueue.add(idPrefix + (suffix === '0' ? '1' : '0'));
  }

  while (fetchQueue.size > 0) {
    const currentCardId = fetchQueue.values().next().value;
    
    if (!currentCardId) {
      break;
    }
    fetchQueue.delete(currentCardId);

    if (visitedCardIds.has(currentCardId)) {
      continue;
    }

    const cardRow = await getCardRowById(db, currentCardId);
    if (!cardRow) {
      visitedCardIds.add(currentCardId);
      continue;
    }
    visitedCardIds.add(currentCardId);

    const cardForm = mapDbRowToCardForm(cardRow);
    allCardForms.push(cardForm);

    if (cardRow.card_unique_info_id && !allCardUniqueInfos.has(cardRow.card_unique_info_id)) {
      const cuiResults = db.exec('SELECT * FROM card_unique_infos WHERE id = ?', [
        cardRow.card_unique_info_id,
      ]);
      const dbCui = resultsToObjects(cuiResults)[0];
      if (dbCui)
        allCardUniqueInfos.set(dbCui.id, {
          id: String(dbCui.id),
          name: getVal(dbCui.name, ''),
          kana: dbCui.kana ? String(dbCui.kana) : null,
        });
    }

    const categoryRows = resultsToObjects(
      db.exec('SELECT card_category_id FROM card_card_categories WHERE card_id = ? ORDER BY num', [
        currentCardId,
      ])
    );
    cardForm.category_ids = categoryRows.map((row) => String(row.card_category_id));

    const passiveSetId = String(cardRow.passive_skill_set_id || '');
    if (passiveSetId && !nonEzaPassiveIdsToSkip.has(passiveSetId)) {
      if (!allPassiveSkillSets.has(passiveSetId)) {
        const pss = await getPassiveSkillSetWithSkills(db, passiveSetId);
        if (pss) {
          allPassiveSkillSets.set(pss.id, pss);
          pss.skills.forEach((skill) => {
            if (
              (skill.efficacy_type === 103 ||
                skill.efficacy_type === 131 ||
                skill.efficacy_type === 79) &&
              skill.eff_value1 &&
              String(skill.eff_value1).trim() !== ''
            ) {
              const transformedCardId = String(skill.eff_value1);
              if (!visitedCardIds.has(transformedCardId)) fetchQueue.add(transformedCardId);
            }
            if (
              skill.passive_skill_effect_id &&
              !allPassiveSkillEffects.has(skill.passive_skill_effect_id)
            ) {
              const pseDb = resultsToObjects(
                db.exec(`SELECT * FROM passive_skill_effects WHERE id = ?`, [
                  skill.passive_skill_effect_id,
                ])
              )[0];
              if (pseDb) allPassiveSkillEffects.set(pseDb.id, mapDbRowToPassiveSkillEffect(pseDb));
            }
          });
        }
      }
    }

    const leaderSetId = String(cardRow.leader_skill_set_id || '');
    if (leaderSetId && !nonEzaLeaderIdsToSkip.has(leaderSetId)) {
      if (!allLeaderSkillSets.has(leaderSetId)) {
        const lss = await getLeaderSkillSetWithSkills(db, leaderSetId);
        if (lss) allLeaderSkillSets.set(lss.id, lss);
      }
    }

    const cardSpecialRows = resultsToObjects(
      db.exec('SELECT * FROM card_specials WHERE card_id = ? ORDER BY priority, eball_num_start', [
        currentCardId,
      ])
    );
    for (const csRow of cardSpecialRows) {
      const specialSetId = String(csRow.special_set_id);

      if (nonEzaSpecialSetIdsToSkip.has(specialSetId)) {
        continue;
      }

      allCardSpecials.push(mapDbRowToCardSpecial(csRow));
      if (specialSetId && !allSpecialSets.has(specialSetId)) {
        const ss = await getSpecialSetWithSkills(db, specialSetId);
        if (ss) allSpecialSets.set(ss.id, ss);
      }
    }

    const casRow = resultsToObjects(
      db.exec('SELECT * FROM card_active_skills WHERE card_id = ? LIMIT 1', [currentCardId])
    )[0] as CardActiveSkill | undefined;
    if (casRow?.active_skill_set_id) {
      cardForm.active_skill_set_id_ref = String(casRow.active_skill_set_id);
      allCardActiveSkills.push({
        id: String(casRow.id),
        card_id: String(casRow.card_id),
        active_skill_set_id: String(casRow.active_skill_set_id),
      });
      const setId = String(casRow.active_skill_set_id);
      if (!allActiveSkillSets.has(setId)) {
        const as = await getActiveSkillSetWithSkills(db, setId);
        if (as) {
          allActiveSkillSets.set(as.id, as);
          as.skills.forEach((skill) => {
            // Check for Revival skills and their effect packs
            if (
              skill.efficacy_type === 109 &&
              skill.eff_val2 &&
              String(skill.eff_val2).trim() !== '' &&
              !allEffectPacks.has(String(skill.eff_val2))
            ) {
              const epDb = resultsToObjects(
                db.exec(`SELECT * FROM effect_packs WHERE id = ?`, [skill.eff_val2])
              )[0];
              if (epDb) allEffectPacks.set(epDb.id, mapDbRowToEffectPack(epDb));
            }

            // Check for transformations (card ID is in eff_val1 for active skills)
            if (
              (skill.efficacy_type === 103 ||
                skill.efficacy_type === 131 ||
                skill.efficacy_type === 79) &&
              skill.eff_val1 &&
              String(skill.eff_val1).trim() !== ''
            ) {
              const transformedCardId = String(skill.eff_val1);
              if (!visitedCardIds.has(transformedCardId)) {
                fetchQueue.add(transformedCardId);
              }
            }
          });
        }
      }
    }

    const standbyRelRow = resultsToObjects(
      db.exec('SELECT * FROM card_standby_skill_set_relations WHERE card_id = ? LIMIT 1', [
        currentCardId,
      ])
    )[0];
    if (standbyRelRow?.standby_skill_set_id) {
      cardForm.standby_skill_set_id_ref = String(standbyRelRow.standby_skill_set_id);
      allCardStandbySkills.push({
        id: standbyRelRow.id,
        card_id: standbyRelRow.card_id,
        standby_skill_set_id: standbyRelRow.standby_skill_set_id,
      });
      const standbySetId = standbyRelRow.standby_skill_set_id;
      if (!allStandbySkillSets.has(standbySetId)) {
        const sss = await getStandbySkillSetWithSkills(db, standbySetId);
        if (sss) {
          allStandbySkillSets.set(sss.id, sss);
          (sss.finishSkillSetRelations || []).forEach((rel) => {
            allStandbySkillSetFinishSkillSetRelations.push(rel);
            const finishSetId = rel.finish_skill_set_id;
            if (!allFinishSkillSets.has(finishSetId)) {
              // This becomes recursive-like, so just add to a temp set to fetch after main loop
              // For simplicity now, just fetch it.
              getFinishSkillSetWithSkills(db, finishSetId).then((fss) => {
                if (fss) {
                  allFinishSkillSets.set(fss.id, fss);
                  if (
                    fss.finish_special_id &&
                    !allFinishSpecials.find((fsp) => fsp.id === fss.finish_special_id)
                  ) {
                    const fspDb = resultsToObjects(
                      db.exec('SELECT * FROM finish_specials WHERE id = ?', [fss.finish_special_id])
                    )[0];
                    if (fspDb)
                      allFinishSpecials.push({
                        id: String(fspDb.id),
                        increase_rate: getVal(fspDb.increase_rate, 0),
                        aim_target: getVal(fspDb.aim_target, 0),
                      });
                  }
                }
              });
            }
          });
        }
      }
    }
  }

  // --- 3.5 FETCH REFERENCED CAUSALITIES ---
  // Helper to extract IDs from JSON string
  const extractCausalityIds = (jsonStr: string | null | undefined): DokkanID[] => {
    if (!jsonStr) return [];
    const ids: DokkanID[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      // Check "source" string for IDs like "43|3429"
      if (parsed && parsed.source && typeof parsed.source === 'string') {
        const matches = parsed.source.match(/\d+/g);
        if (matches) {
          matches.forEach((m: string) => ids.push(m));
        }
      }
      // Also check "compiled" array for raw numbers
      if (parsed && parsed.compiled && Array.isArray(parsed.compiled)) {
        const traverse = (node: any) => {
          if (Array.isArray(node)) {
            node.forEach(traverse);
          } else if (typeof node === 'number' || (typeof node === 'string' && !isNaN(Number(node)))) {
            // It's a number, potentially an ID if not a type/param.
            // But wait, compiled format is ["type", typeId, [params]] OR ["|", refId1, refId2]
            // If it's a reference ID, it appears directly in the array.
            // If it's a type ID, it's the second element of a "type" array.
            // We might just fetch everything that looks like an ID to be safe, or rely on source string.
            // Let's rely on source string primarily as it's safer for now, or just fetch if we can distinguish.
            // Actually, for robustness, let's just rely on the source string regex for now as it's likely to contain the IDs used.
          }
        };
        // traverse(parsed.compiled);
      }
    } catch (e) {
      // ignore
    }
    return ids;
  };

  const allSkillsWithCausality = [
    ...Array.from(allPassiveSkillSets.values()).flatMap(s => s.skills),
    ...Array.from(allLeaderSkillSets.values()).flatMap(s => s.skills),
    ...Array.from(allSpecialSets.values()).flatMap(s => s.skills),
    ...Array.from(allActiveSkillSets.values()).flatMap(s => s.skills),
    ...Array.from(allStandbySkillSets.values()).flatMap(s => s.skills),
    ...Array.from(allFinishSkillSets.values()).flatMap(s => s.skills),
    ...allCardSpecials,
  ];

  allSkillsWithCausality.forEach(skill => {
    const s = skill as any;
    if (s.causality_conditions) {
      const ids = extractCausalityIds(s.causality_conditions);
      ids.forEach(id => {
        if (!visitedCausalityIds.has(id)) {
          visitedCausalityIds.add(id);
          const rows = resultsToObjects(db.exec('SELECT * FROM skill_causalities WHERE id = ?', [id]));
          if (rows.length > 0) {
            allSkillCausalities.push(mapDbRowToSkillCausality(rows[0]));
          }
        }
      });
    }
  });

  // --- 4. EZA POST-PROCESSING ---
  if (options.loadEza && ezaDetails.optimalAwakeningGrowth) {
    const ezaPssId = ezaDetails.optimalAwakeningGrowth.passive_skill_set_id;
    const ezaLssId = ezaDetails.optimalAwakeningGrowth.leader_skill_set_id;
    const idPrefixForUpdate = initialSelectedCardId.slice(0, -1);

    // --- New Robust Cleanup Logic ---
    // 1. Collect all unique pre-EZA skill set IDs from the loaded card forms of the target unit
    const actualPreEzaPassiveIds = new Set<DokkanID>();
    const actualPreEzaLeaderIds = new Set<DokkanID>();
    allCardForms.forEach((cf) => {
      if (cf.id.startsWith(idPrefixForUpdate)) {
        if (cf.passive_skill_set_id) actualPreEzaPassiveIds.add(cf.passive_skill_set_id);
        if (cf.leader_skill_set_id) actualPreEzaLeaderIds.add(cf.leader_skill_set_id);
      }
    });

    // 2. Fetch the EZA skill sets and add them to the state.
    if (ezaPssId && !allPassiveSkillSets.has(ezaPssId)) {
      const pss = await getPassiveSkillSetWithSkills(db, ezaPssId);
      if (pss) allPassiveSkillSets.set(pss.id, pss);
    }
    if (ezaLssId && !allLeaderSkillSets.has(ezaLssId)) {
      const lss = await getLeaderSkillSetWithSkills(db, ezaLssId);
      if (lss) allLeaderSkillSets.set(lss.id, lss);
    }

    // 3. Update the card forms to point to the correct EZA skill sets
    allCardForms.forEach((cf) => {
      if (cf.id.startsWith(idPrefixForUpdate)) {
        cf.passive_skill_set_id = ezaPssId;
        cf.leader_skill_set_id = ezaLssId;
        cf.optimal_awakening_grow_type =
          ezaDetails.optimalAwakeningGrowth!.optimal_awakening_grow_type;
      }
    });

    // 4. Clean up the main collections using the definitive list of pre-EZA IDs
    actualPreEzaPassiveIds.forEach((id) => {
      if (id !== ezaPssId) {
        allPassiveSkillSets.delete(id);
      }
    });
    actualPreEzaLeaderIds.forEach((id) => {
      if (id !== ezaLssId) {
        allLeaderSkillSets.delete(id);
      }
    });
  }

  if (allCardForms.length === 0) return null;

  // --- 5. FINAL ASSEMBLY ---
  allCardForms.sort((a, b) => {
    if (a.id.startsWith(idPrefix) && !b.id.startsWith(idPrefix)) return -1;
    if (!a.id.startsWith(idPrefix) && b.id.startsWith(idPrefix)) return 1;
    return a.id.localeCompare(b.id);
  });

  return {
    cardForms: allCardForms,
    cardUniqueInfos: Array.from(allCardUniqueInfos.values()),
    passiveSkillSets: Array.from(allPassiveSkillSets.values()),
    leaderSkillSets: Array.from(allLeaderSkillSets.values()),
    specialSets: Array.from(allSpecialSets.values()),
    activeSkillSets: Array.from(allActiveSkillSets.values()),
    cardSpecials: allCardSpecials,
    cardActiveSkills: allCardActiveSkills,
    cardStandbySkills: allCardStandbySkills,
    standbySkillSets: Array.from(allStandbySkillSets.values()),
    finishSkillSets: Array.from(allFinishSkillSets.values()),
    standbySkillSetFinishSkillSetRelations: allStandbySkillSetFinishSkillSetRelations,
    finishSpecials: allFinishSpecials,
    battleParams: allBattleParams,
    skillCausalities: allSkillCausalities,
    passiveSkillEffects: Array.from(allPassiveSkillEffects.values()),
    effectPacks: Array.from(allEffectPacks.values()),
    characters: [],
    subTargetTypeSets: [],
    subTargetTypes: [],
    ultimateSpecials: [],
    specialViews: [],
    cardAwakeningRoutes: [],
    sqlConverterInput: '',
    sqlConverterOutput: '',
    ...ezaDetails,
  };
};

export const getCharacterForPlanner = async (
  db: Database,
  cardId: DokkanID
): Promise<PlannedCard | null> => {
  const patchState = await getCharacterDetails(db, cardId, { loadEza: false });
  if (!patchState || patchState.cardForms.length === 0) return null;

  const mainCard = patchState.cardForms[0];
  const plannedCard: PlannedCard = {
    dokkanCardId: mainCard.id,
    plannerCardId: generateLocalId(),
    name: mainCard.name,
    title: '',
    element: mainCard.element,
    rarity: mainCard.rarity,
    leaderSkillText: '',
    passiveSkillText: '',
    superAttacks: [],
    activeSkillName: '',
    activeSkillConditions: '',
    activeSkillText: '',
    miscSections: [],
  };

  const cui = patchState.cardUniqueInfos.find((c) => c.id === mainCard.card_unique_info_id);
  if (cui) plannedCard.title = cui.name;

  const leaderSet = patchState.leaderSkillSets.find((ls) => ls.id === mainCard.leader_skill_set_id);
  if (leaderSet) {
    plannedCard.leaderSkillText = leaderSet.description || 'No description found.';
  }

  const passiveSet = patchState.passiveSkillSets.find(
    (ps) => ps.id === mainCard.passive_skill_set_id
  );
  if (passiveSet) {
    plannedCard.passiveSkillText =
      passiveSet.itemized_description || 'No itemized description found.';
  }

  const cardSpecials = patchState.cardSpecials
    .filter((cs) => cs.card_id === mainCard.id)
    .sort((a, b) => a.priority - b.priority);
  cardSpecials.forEach((cs) => {
    const specialSet = patchState.specialSets.find((ss) => ss.id === cs.special_set_id);
    if (specialSet) {
      const effectsText = specialSet.skills
        .map((s) => `Efficacy ${s.efficacy_type} on target ${s.target_type}`)
        .join('\n');
      const fullDesc = specialSet.description || effectsText;

      plannedCard.superAttacks.push({
        id: generateLocalId(),
        name: specialSet.name || 'Super Attack',
        text: fullDesc,
      });
    }
  });

  if (plannedCard.superAttacks.length === 0) {
    // If no SAs are found from DB, default based on rarity
    plannedCard.superAttacks.push({ id: generateLocalId(), name: 'Super Attack', text: '' });
    if (mainCard.rarity !== 4) {
      // Not a UR (so it's LR, SSR etc)
      plannedCard.superAttacks.push({
        id: generateLocalId(),
        name: 'Ultra Super Attack',
        text: '',
      });
    }
  } else if (plannedCard.superAttacks.length === 1 && mainCard.rarity !== 4) {
    // If one SA is found and it's not a UR, add a second slot (for LRs that might have a 12 ki but not 18 ki defined weirdly)
    plannedCard.superAttacks.push({ id: generateLocalId(), name: 'Ultra Super Attack', text: '' });
  }

  const activeSkillLink = patchState.cardActiveSkills.find((cas) => cas.card_id === mainCard.id);
  if (activeSkillLink) {
    const activeSet = patchState.activeSkillSets.find(
      (as) => as.id === activeSkillLink.active_skill_set_id
    );
    if (activeSet) {
      plannedCard.activeSkillName = activeSet.name;
      plannedCard.activeSkillConditions = activeSet.condition_description;
      plannedCard.activeSkillText = activeSet.effect_description;
    }
  }

  return plannedCard;
};

export const createEzaFromCharacter = async (
  db: Database,
  originalCardId: DokkanID,
  newEzaBaseId: DokkanID
): Promise<DokkanPatchState | null> => {
  const originalState = await getCharacterDetails(db, originalCardId, { loadEza: false });
  if (!originalState || originalState.cardForms.length === 0) return null;

  const newEzaState: DokkanPatchState = {
    cardForms: [],
    cardUniqueInfos: [],
    passiveSkillSets: [],
    leaderSkillSets: [],
    specialSets: [],
    activeSkillSets: [],
    cardSpecials: [],
    cardActiveSkills: [],
    cardStandbySkills: [],
    passiveSkillEffects: [...originalState.passiveSkillEffects],
    effectPacks: [...originalState.effectPacks],
    standbySkillSets: [],
    finishSkillSets: [],
    standbySkillSetFinishSkillSetRelations: [],
    finishSpecials: [],
    subTargetTypeSets: [],
    subTargetTypes: [],
    ultimateSpecials: [],
    specialViews: [],
    cardAwakeningRoutes: [],
    characters: [],
    battleParams: [],
    skillCausalities: [],
    isEZA: true,
    baseCardIdForEZA: originalCardId,
    optimalAwakeningGrowth: undefined,
    sqlConverterInput: '',
    sqlConverterOutput: '',
  };

  // ── Group original card forms by prefix (all digits except the last) ──
  // Each group represents a card-form pair (e.g., 1062390/1062391, 1062400/1062401)
  const formGroups = new Map<string, CardForm[]>();
  for (const form of originalState.cardForms) {
    const prefix = form.id.slice(0, -1);
    if (!formGroups.has(prefix)) formGroups.set(prefix, []);
    formGroups.get(prefix)!.push(form);
  }

  // Sort groups by numeric prefix so they map deterministically
  const sortedGroupEntries = [...formGroups.entries()].sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  const numericBase = Number(newEzaBaseId);

  // Dedup maps: old skill-set ID → new EZA skill-set ID
  const passiveSetIdMap = new Map<DokkanID, DokkanID>();
  const leaderSetIdMap = new Map<DokkanID, DokkanID>();
  const specialSetIdMap = new Map<DokkanID, DokkanID>();
  const activeSetIdMap = new Map<DokkanID, DokkanID>();
  const standbySetIdMap = new Map<DokkanID, DokkanID>();
  const finishSetIdMap = new Map<DokkanID, DokkanID>();
  const finishSpecialIdMap = new Map<DokkanID, DokkanID>();

  // Track which original form IDs get explicitly EZA'd by the group loop
  const processedOriginalFormIds = new Set<DokkanID>();

  // ── Shared CUI: create once from the first group's template ──
  const firstGroupForms = sortedGroupEntries[0][1];
  const firstTemplateForm =
    firstGroupForms.find((f) => f.id.endsWith('0')) || firstGroupForms[0];

  const rarity = firstTemplateForm.rarity;
  const rarityDefaults =
    rarity === 5 ? LR_RARITY_DEFAULTS : rarity === 4 ? UR_RARITY_DEFAULTS : null;

  const newCuiId = ID_PREFIXES.CARD_UNIQUE_INFO + newEzaBaseId;
  const originalCui = originalState.cardUniqueInfos.find(
    (cui) => cui.id === firstTemplateForm.card_unique_info_id
  );
  if (originalCui) {
    newEzaState.cardUniqueInfos.push({
      ...originalCui,
      id: newCuiId,
      name: `[EZA] ${originalCui.name}`,
    });
  }

  // ── Process each original card-form pair into EZA versions ──
  for (let groupIdx = 0; groupIdx < sortedGroupEntries.length; groupIdx++) {
    const [, groupForms] = sortedGroupEntries[groupIdx];
    const newPrefixNum = numericBase + groupIdx;
    const newPrefix = String(newPrefixNum);

    // Mark these original forms as processed
    groupForms.forEach((f) => processedOriginalFormIds.add(f.id));

    // Pick the '0'-suffixed form as the template for this pair
    const groupTemplate =
      groupForms.find((f) => f.id.endsWith('0')) || groupForms[0];

    const cardForm0: CardForm = JSON.parse(JSON.stringify(groupTemplate));
    const cardForm1: CardForm = JSON.parse(JSON.stringify(groupTemplate));

    if (rarityDefaults) {
      Object.assign(cardForm0, rarityDefaults);
      Object.assign(cardForm1, rarityDefaults);
    }

    const cardId0 = newPrefix + '0';
    const cardId1 = newPrefix + '1';

    cardForm0.id = cardId0;
    cardForm0.name = `[EZA] ${groupTemplate.name}`;
    cardForm1.id = cardId1;
    cardForm1.name = `[EZA] ${groupTemplate.name}`;

    cardForm0.card_unique_info_id = newCuiId;
    cardForm1.card_unique_info_id = newCuiId;

    newEzaState.cardForms.push(cardForm0, cardForm1);

    // ── Passive Skill Set ──
    const origPassiveId = groupTemplate.passive_skill_set_id;
    if (origPassiveId) {
      if (!passiveSetIdMap.has(origPassiveId)) {
        const origSet = originalState.passiveSkillSets.find((ps) => ps.id === origPassiveId);
        if (origSet) {
          const newId = ID_PREFIXES.PASSIVE_SKILL_SET + newPrefix;
          const newSet: PassiveSkillSet = JSON.parse(JSON.stringify(origSet));
          newSet.id = newId;
          newSet.name = `${origSet.name} (Extreme)`;
          newSet.skills.forEach((skill, idx) => {
            skill.id = idx === 0 ? newId : String(idx * 100) + newId;
          });
          newEzaState.passiveSkillSets.push(newSet);
          passiveSetIdMap.set(origPassiveId, newId);
        }
      }
      const mappedId = passiveSetIdMap.get(origPassiveId);
      if (mappedId) {
        cardForm0.passive_skill_set_id = mappedId;
        cardForm1.passive_skill_set_id = mappedId;
      }
    }

    // ── Leader Skill Set ──
    const origLeaderId = groupTemplate.leader_skill_set_id;
    if (origLeaderId) {
      if (!leaderSetIdMap.has(origLeaderId)) {
        const origSet = originalState.leaderSkillSets.find((ls) => ls.id === origLeaderId);
        if (origSet) {
          const newId = ID_PREFIXES.LEADER_SKILL_SET + newPrefix;
          const newSet: LeaderSkillSet = JSON.parse(JSON.stringify(origSet));
          newSet.id = newId;
          newSet.name = `${origSet.name} (Extreme)`;
          newSet.skills.forEach((skill, idx) => {
            skill.id = newId + String(idx).padStart(2, '0');
            skill.leader_skill_set_id = newId;
          });
          newEzaState.leaderSkillSets.push(newSet);
          leaderSetIdMap.set(origLeaderId, newId);
        }
      }
      const mappedId = leaderSetIdMap.get(origLeaderId);
      if (mappedId) {
        cardForm0.leader_skill_set_id = mappedId;
        cardForm1.leader_skill_set_id = mappedId;
      }
    }

    // ── Card Specials (Super Attacks) ──
    const groupCardSpecials = originalState.cardSpecials.filter(
      (cs) => cs.card_id === groupTemplate.id
    );
    groupCardSpecials.forEach((origCs, specIdx) => {
      const origSpecSetId = origCs.special_set_id;
      if (!specialSetIdMap.has(origSpecSetId)) {
        const origSet = originalState.specialSets.find((ss) => ss.id === origSpecSetId);
        if (origSet) {
          const newId = ID_PREFIXES.SPECIAL_SET + newPrefix + specIdx;
          const newSet: SpecialSet = JSON.parse(JSON.stringify(origSet));
          newSet.id = newId;
          newSet.name = `${origSet.name} (Extreme)`;
          newSet.skills.forEach((skill, idx) => {
            skill.id = idx === 0 ? newId : String(idx * 100) + newId;
            skill.special_set_id = newId;
          });
          newEzaState.specialSets.push(newSet);
          specialSetIdMap.set(origSpecSetId, newId);
        }
      }
      const mappedId = specialSetIdMap.get(origSpecSetId);
      if (mappedId) {
        newEzaState.cardSpecials.push(
          { ...origCs, id: generateLocalId(), card_id: cardId0, special_set_id: mappedId },
          { ...origCs, id: generateLocalId(), card_id: cardId1, special_set_id: mappedId }
        );
      }
    });

    // ── Active Skill ──
    const origActiveRel = originalState.cardActiveSkills.find(
      (cas) => cas.card_id === groupTemplate.id
    );
    if (origActiveRel) {
      const origActiveSetId = origActiveRel.active_skill_set_id;
      if (!activeSetIdMap.has(origActiveSetId)) {
        const origSet = originalState.activeSkillSets.find((as) => as.id === origActiveSetId);
        if (origSet) {
          const newId = ID_PREFIXES.ACTIVE_SKILL_SET + newPrefix;
          const newSet: ActiveSkillSet = JSON.parse(JSON.stringify(origSet));
          newSet.id = newId;
          newSet.name = `${origSet.name} (Extreme)`;
          newSet.skills.forEach((skill, idx) => {
            skill.id = newId + String(idx + 1);
            skill.active_skill_set_id = newId;
          });
          newEzaState.activeSkillSets.push(newSet);
          activeSetIdMap.set(origActiveSetId, newId);
        }
      }
      const mappedId = activeSetIdMap.get(origActiveSetId);
      if (mappedId) {
        newEzaState.cardActiveSkills.push(
          { id: generateLocalId(), card_id: cardId0, active_skill_set_id: mappedId },
          { id: generateLocalId(), card_id: cardId1, active_skill_set_id: mappedId }
        );
        cardForm0.active_skill_set_id_ref = mappedId;
        cardForm1.active_skill_set_id_ref = mappedId;
      }
    }

    // ── Standby Skill (and its Finish Skills) ──
    const origStandbyRel = originalState.cardStandbySkills.find(
      (css) => css.card_id === groupTemplate.id
    );
    if (origStandbyRel) {
      const origStandbySetId = origStandbyRel.standby_skill_set_id;
      if (!standbySetIdMap.has(origStandbySetId)) {
        const origSet = originalState.standbySkillSets.find(
          (ss) => ss.id === origStandbySetId
        );
        if (origSet) {
          const newId = ID_PREFIXES.STANDBY_SKILL_SET + newPrefix;
          const newSet: StandbySkillSet = JSON.parse(JSON.stringify(origSet));
          newSet.id = newId;
          newSet.name = `${origSet.name} (Extreme)`;
          newSet.skills.forEach((skill) => {
            skill.id = generateLocalId();
            skill.standby_skill_set_id = newId;
          });
          newEzaState.standbySkillSets.push(newSet);
          standbySetIdMap.set(origStandbySetId, newId);

          // Duplicate finish-skill relations
          const origRelations =
            originalState.standbySkillSetFinishSkillSetRelations.filter(
              (rel) => rel.standby_skill_set_id === origStandbySetId
            );
          origRelations.forEach((rel, finIdx) => {
            const origFinishSet = originalState.finishSkillSets.find(
              (fs) => fs.id === rel.finish_skill_set_id
            );
            if (origFinishSet && !finishSetIdMap.has(origFinishSet.id)) {
              const newFinishId = ID_PREFIXES.FINISH_SKILL_SET + newPrefix + finIdx;
              const newFinishSet: FinishSkillSet = JSON.parse(JSON.stringify(origFinishSet));
              newFinishSet.id = newFinishId;
              newFinishSet.name = `${origFinishSet.name} (Extreme)`;
              newFinishSet.skills.forEach((skill) => {
                skill.id = generateLocalId();
                skill.finish_skill_set_id = newFinishId;
              });
              if (origFinishSet.finish_special_id) {
                const origFsp = originalState.finishSpecials.find(
                  (fsp) => fsp.id === origFinishSet.finish_special_id
                );
                if (origFsp && !finishSpecialIdMap.has(origFsp.id)) {
                  const newFspId = ID_PREFIXES.FINISH_SPECIAL + newPrefix + finIdx;
                  newEzaState.finishSpecials.push({ ...origFsp, id: newFspId });
                  finishSpecialIdMap.set(origFsp.id, newFspId);
                  newFinishSet.finish_special_id = newFspId;
                } else if (origFsp) {
                  newFinishSet.finish_special_id =
                    finishSpecialIdMap.get(origFsp.id) || origFinishSet.finish_special_id;
                }
              }
              newEzaState.finishSkillSets.push(newFinishSet);
              finishSetIdMap.set(origFinishSet.id, newFinishId);
            }
            const mappedFinishId = finishSetIdMap.get(origFinishSet?.id || '');
            if (mappedFinishId) {
              newEzaState.standbySkillSetFinishSkillSetRelations.push({
                id: generateLocalId(),
                standby_skill_set_id: newId,
                finish_skill_set_id: mappedFinishId,
              });
            }
          });
        }
      }
      const mappedId = standbySetIdMap.get(origStandbySetId);
      if (mappedId) {
        newEzaState.cardStandbySkills.push(
          { id: generateLocalId(), card_id: cardId0, standby_skill_set_id: mappedId },
          { id: generateLocalId(), card_id: cardId1, standby_skill_set_id: mappedId }
        );
        cardForm0.standby_skill_set_id_ref = mappedId;
        cardForm1.standby_skill_set_id_ref = mappedId;
      }
    }
  }

  // ── Optimal Awakening Growth (single entry for the whole EZA) ──
  const firstNewPrefix = String(numericBase);
  const newOagTypeId = firstNewPrefix + '0';
  const newOag: OptimalAwakeningGrowth = {
    id: ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + newOagTypeId,
    optimal_awakening_grow_type: newOagTypeId,
    step: firstTemplateForm.rarity === 5 ? 3 : 7,
    lv_max: firstTemplateForm.rarity === 5 ? 150 : 140,
    skill_lv_max: firstTemplateForm.rarity === 5 ? 25 : 15,
    passive_skill_set_id: newEzaState.passiveSkillSets[0]?.id || '',
    leader_skill_set_id: newEzaState.leaderSkillSets[0]?.id || '',
  };
  newEzaState.optimalAwakeningGrowth = newOag;

  // All new EZA card forms point to the same OAG type
  newEzaState.cardForms.forEach((cf) => {
    cf.optimal_awakening_grow_type = newOagTypeId;
  });

  // ── Merge back transformation forms not covered by our groups ──
  // These are forms with truly different ID families (e.g., transformations
  // discovered via passive-skill eff_value1 pointing to a different card).
  const allProcessedEntityIds = new Set([
    ...newEzaState.cardForms.map((e) => e.id),
    ...newEzaState.cardUniqueInfos.map((e) => e.id),
    ...newEzaState.passiveSkillSets.map((e) => e.id),
    ...newEzaState.leaderSkillSets.map((e) => e.id),
    ...newEzaState.specialSets.map((e) => e.id),
    ...newEzaState.activeSkillSets.map((e) => e.id),
    ...newEzaState.standbySkillSets.map((e) => e.id),
    ...newEzaState.finishSkillSets.map((e) => e.id),
    ...newEzaState.finishSpecials.map((e) => e.id),
  ]);

  const addEntityIfNotProcessed = <T extends { id: DokkanID }>(entity: T, targetList: T[]) => {
    if (!allProcessedEntityIds.has(entity.id)) {
      targetList.push(entity);
      allProcessedEntityIds.add(entity.id);
    }
  };

  originalState.cardForms.forEach((form) => {
    if (!processedOriginalFormIds.has(form.id)) {
      addEntityIfNotProcessed(form, newEzaState.cardForms);

      const cui = originalState.cardUniqueInfos.find((c) => c.id === form.card_unique_info_id);
      if (cui) addEntityIfNotProcessed(cui, newEzaState.cardUniqueInfos);

      const pss = originalState.passiveSkillSets.find((p) => p.id === form.passive_skill_set_id);
      if (pss) addEntityIfNotProcessed(pss, newEzaState.passiveSkillSets);

      const lss = originalState.leaderSkillSets.find((l) => l.id === form.leader_skill_set_id);
      if (lss) addEntityIfNotProcessed(lss, newEzaState.leaderSkillSets);

      const activeRel = originalState.cardActiveSkills.find((cas) => cas.card_id === form.id);
      if (activeRel) {
        addEntityIfNotProcessed(activeRel, newEzaState.cardActiveSkills);
        const as = originalState.activeSkillSets.find(
          (a) => a.id === activeRel.active_skill_set_id
        );
        if (as) addEntityIfNotProcessed(as, newEzaState.activeSkillSets);
      }

      const standbyRel = originalState.cardStandbySkills.find((css) => css.card_id === form.id);
      if (standbyRel) {
        addEntityIfNotProcessed(standbyRel, newEzaState.cardStandbySkills);
        const ss = originalState.standbySkillSets.find(
          (s) => s.id === standbyRel.standby_skill_set_id
        );
        if (ss) {
          addEntityIfNotProcessed(ss, newEzaState.standbySkillSets);
          // Also carry over related finish sets
          const finRels =
            originalState.standbySkillSetFinishSkillSetRelations.filter(
              (r) => r.standby_skill_set_id === ss.id
            );
          finRels.forEach((fr) => {
            addEntityIfNotProcessed(fr, newEzaState.standbySkillSetFinishSkillSetRelations);
            const fs = originalState.finishSkillSets.find(
              (f) => f.id === fr.finish_skill_set_id
            );
            if (fs) {
              addEntityIfNotProcessed(fs, newEzaState.finishSkillSets);
              if (fs.finish_special_id) {
                const fsp = originalState.finishSpecials.find(
                  (f) => f.id === fs.finish_special_id
                );
                if (fsp) addEntityIfNotProcessed(fsp, newEzaState.finishSpecials);
              }
            }
          });
        }
      }

      const specials = originalState.cardSpecials.filter((cs) => cs.card_id === form.id);
      specials.forEach((cs) => {
        addEntityIfNotProcessed(cs, newEzaState.cardSpecials);
        const ss = originalState.specialSets.find((s) => s.id === cs.special_set_id);
        if (ss) addEntityIfNotProcessed(ss, newEzaState.specialSets);
      });
    }
  });

  return newEzaState;
};

// Internal helper functions to query DB
const getCardRowById = async (db: Database, cardId: DokkanID): Promise<CardDBRow | null> => {
  try {
    const res = db.exec('SELECT * FROM cards WHERE id = ?', [cardId]);
    return (resultsToObjects(res)[0] as CardDBRow) || null;
  } catch (e) {
    console.error(`Error fetching card row for id ${cardId}:`, e);
    return null;
  }
};

export const getPassiveSkillSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<PassiveSkillSet | null> => {
  const pssRes = db.exec('SELECT * FROM passive_skill_sets WHERE id = ?', [setId]);
  const pssDb = resultsToObjects(pssRes)[0];
  if (!pssDb) return null;

  const relationsRes = db.exec(
    'SELECT passive_skill_id FROM passive_skill_set_relations WHERE passive_skill_set_id = ?',
    [setId]
  );
  const skillIds = resultsToObjects(relationsRes).map((r) => r.passive_skill_id);

  const skills: PassiveSkill[] = [];
  for (const skillId of skillIds) {
    const skillRes = db.exec('SELECT * FROM passive_skills WHERE id = ?', [skillId]);
    const skillDb = resultsToObjects(skillRes)[0];
    if (skillDb) skills.push(mapDbRowToPassiveSkill(skillDb));
  }

  return {
    id: String(pssDb.id),
    name: getVal(pssDb.name, ''),
    itemized_description: getVal(pssDb.itemized_description, null),
    skills,
  };
};

export const getLeaderSkillSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<LeaderSkillSet | null> => {
  const lssRes = db.exec('SELECT * FROM leader_skill_sets WHERE id = ?', [setId]);
  const lssDb = resultsToObjects(lssRes)[0];
  if (!lssDb) return null;

  const skillsRes = db.exec('SELECT * FROM leader_skills WHERE leader_skill_set_id = ?', [setId]);
  const skills = resultsToObjects(skillsRes).map((s) => mapDbRowToLeaderSkill(s, setId));

  return {
    id: String(lssDb.id),
    name: getVal(lssDb.name, ''),
    description: getVal(lssDb.description, null),
    skills,
  };
};

export const getSpecialSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<SpecialSet | null> => {
  const ssRes = db.exec('SELECT * FROM special_sets WHERE id = ?', [setId]);
  const ssDb = resultsToObjects(ssRes)[0];
  if (!ssDb) return null;

  const skillsRes = db.exec('SELECT * FROM specials WHERE special_set_id = ?', [setId]);
  const skills = resultsToObjects(skillsRes).map((s) => mapDbRowToSpecial(s, setId));

  return {
    id: String(ssDb.id),
    name: getVal(ssDb.name, ''),
    description: getVal(ssDb.description, null),
    causality_description: getVal(ssDb.causality_description, null),
    aim_target: getVal(ssDb.aim_target, 0),
    increase_rate: getVal(ssDb.increase_rate, 0),
    lv_bonus: getVal(ssDb.lv_bonus, 0),
    is_inactive: getVal(ssDb.is_inactive, 0),
    skills,
  };
};

export const getActiveSkillSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<ActiveSkillSet | null> => {
  const asRes = db.exec('SELECT * FROM active_skill_sets WHERE id = ?', [setId]);
  const asDb = resultsToObjects(asRes)[0];
  if (!asDb) return null;

  const skillsRes = db.exec('SELECT * FROM active_skills WHERE active_skill_set_id = ?', [setId]);
  const skills = resultsToObjects(skillsRes).map((s) => mapDbRowToActiveSkillEffect(s, setId));

  return {
    id: String(asDb.id),
    name: getVal(asDb.name, ''),
    effect_description: getVal(asDb.effect_description, ''),
    condition_description: getVal(asDb.condition_description, ''),
    turn: getVal(asDb.turn, 0),
    exec_limit: getVal(asDb.exec_limit, 0),
    causality_conditions: getVal(asDb.causality_conditions, null),
    ultimate_special_id: getVal(asDb.ultimate_special_id, null),
    special_view_id: getVal(asDb.special_view_id, null),
    costume_special_view_id: getVal(asDb.costume_special_view_id, 0),
    bgm_id: getVal(asDb.bgm_id, null),
    skills,
  };
};

export const createSkillCausality = async (
  db: Database,
  causality_type: number,
  cau_val1: number | string,
  cau_val2: number | string,
  cau_val3: number | string
): Promise<DokkanID> => {
  // Find the max ID to increment
  const res = db.exec('SELECT MAX(id) as maxId FROM skill_causalities');
  const maxId = res[0]?.values[0]?.[0];
  const newId = (typeof maxId === 'number' ? maxId : 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO skill_causalities (
      id, causality_type, cau_val1, cau_val2, cau_val3
    ) VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([newId, causality_type, cau_val1, cau_val2, cau_val3]);
  stmt.free();

  return String(newId);
};

export const getSkillCausality = async (
  db: Database,
  id: DokkanID
): Promise<SkillCausality | null> => {
  const rows = resultsToObjects(db.exec('SELECT * FROM skill_causalities WHERE id = ?', [id]));
  if (rows.length === 0) return null;
  return mapDbRowToSkillCausality(rows[0]);
};

export const getStandbySkillSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<StandbySkillSet | null> => {
  const sssRes = db.exec('SELECT * FROM standby_skill_sets WHERE id = ?', [setId]);
  const sssDb = resultsToObjects(sssRes)[0];
  if (!sssDb) return null;

  const skillsRes = db.exec('SELECT * FROM standby_skills WHERE standby_skill_set_id = ?', [setId]);
  const skills = resultsToObjects(skillsRes).map((s) => mapDbRowToStandbySkill(s, setId));

  const relationsRes = db.exec(
    'SELECT * FROM standby_skill_set_finish_skill_set_relations WHERE standby_skill_set_id = ?',
    [setId]
  );
  const finishSkillSetRelations = resultsToObjects(relationsRes).map((r) => ({
    id: String(r.id),
    standby_skill_set_id: String(r.standby_skill_set_id),
    finish_skill_set_id: String(r.finish_skill_set_id),
  }));

  return {
    id: String(sssDb.id),
    name: getVal(sssDb.name, ''),
    ingame_icon_path: getVal(sssDb.ingame_icon_path, ''),
    effect_description: getVal(sssDb.effect_description, ''),
    condition_description: getVal(sssDb.condition_description, ''),
    exec_limit: getVal(sssDb.exec_limit, 0),
    causality_conditions: getVal(sssDb.causality_conditions, null),
    special_view_id: getVal(sssDb.special_view_id, null),
    costume_special_view_id: getVal(sssDb.costume_special_view_id, 0),
    bgm_id: getVal(sssDb.bgm_id, null),
    skills,
    finishSkillSetRelations,
  };
};

export const getFinishSkillSetWithSkills = async (
  db: Database,
  setId: DokkanID
): Promise<FinishSkillSet | null> => {
  const fssRes = db.exec('SELECT * FROM finish_skill_sets WHERE id = ?', [setId]);
  const fssDb = resultsToObjects(fssRes)[0];
  if (!fssDb) return null;

  const skillsRes = db.exec('SELECT * FROM finish_skills WHERE finish_skill_set_id = ?', [setId]);
  const skills = resultsToObjects(skillsRes).map((s) => mapDbRowToFinishSkill(s, setId));

  return {
    id: String(fssDb.id),
    name: getVal(fssDb.name, ''),
    effect_description: getVal(fssDb.effect_description, ''),
    condition_description: getVal(fssDb.condition_description, ''),
    dialog_order: getVal(fssDb.dialog_order, 0),
    dialog_images: getVal(fssDb.dialog_images, undefined),
    exec_timing_type: getVal(fssDb.exec_timing_type, 0),
    exec_limit: getVal(fssDb.exec_limit, 0),
    causality_conditions: getVal(fssDb.causality_conditions, null),
    finish_special_id: getVal(fssDb.finish_special_id, null),
    special_view_id: getVal(fssDb.special_view_id, null),
    costume_special_view_id: getVal(fssDb.costume_special_view_id, 0),
    bgm_id: getVal(fssDb.bgm_id, null),
    is_dialog_view_visible: getVal(fssDb.is_dialog_view_visible, 1),
    skills,
  };
};

export const getCharacterSkillSet = async (
  db: Database,
  cardId: DokkanID,
  type: TargetSkillSetType
): Promise<AnySkillSet | SpecialSet[] | null> => {
  const card = await getCardRowById(db, cardId);
  if (!card) return null;

  try {
    switch (type) {
      case 'passiveSkillSets':
        return card.passive_skill_set_id
          ? getPassiveSkillSetWithSkills(db, String(card.passive_skill_set_id))
          : null;
      case 'leaderSkillSets':
        return card.leader_skill_set_id
          ? getLeaderSkillSetWithSkills(db, String(card.leader_skill_set_id))
          : null;
      case 'activeSkillSets': {
        const rel = db.exec(
          'SELECT active_skill_set_id FROM card_active_skills WHERE card_id = ?',
          [cardId]
        );
        const relRow = resultsToObjects(rel)[0];
        return relRow?.active_skill_set_id
          ? getActiveSkillSetWithSkills(db, String(relRow.active_skill_set_id))
          : null;
      }
      case 'standbySkillSets': {
        const rel = db.exec(
          'SELECT standby_skill_set_id FROM card_standby_skill_set_relations WHERE card_id = ?',
          [cardId]
        );
        const relRow = resultsToObjects(rel)[0];
        return relRow?.standby_skill_set_id
          ? getStandbySkillSetWithSkills(db, String(relRow.standby_skill_set_id))
          : null;
      }
      case 'finishSkillSets': {
        // Note: A card doesn't directly link to a finish skill set. This would be via standby.
        return null;
      }
      case 'specialSets': {
        const rels = db.exec(
          'SELECT special_set_id FROM card_specials WHERE card_id = ? ORDER BY priority',
          [cardId]
        );
        const setIds = resultsToObjects(rels).map((r) => String(r.special_set_id));
        const sets = await Promise.all(setIds.map((id) => getSpecialSetWithSkills(db, id)));
        return sets.filter((s) => s !== null) as SpecialSet[];
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Error fetching skill set of type ${type} for card ${cardId}:`, e);
    return null;
  }
};
export const getSpecialView = async (db: Database, id: DokkanID): Promise<SpecialView | null> => {
  try {
    const res = db.exec('SELECT * FROM special_views WHERE id = ?', [id]);
    const row = resultsToObjects(res)[0];
    if (!row) return null;
    return {
      id: String(row.id),
      script_name: getVal(row.script_name, ''),
      cut_in_card_id: getVal(row.cut_in_card_id, 0),
      special_name_no: getVal(row.special_name_no, 0),
      special_motion: getVal(row.special_motion, 0),
      lite_flicker_rate: getVal(row.lite_flicker_rate, 0),
      energy_color: row.energy_color ? Number(row.energy_color) : null,
      special_category_id: getVal(row.special_category_id, 0),
    };
  } catch (e) {
    console.error(`Error fetching special view ${id}:`, e);
    return null;
  }
};
