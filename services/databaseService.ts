
import initSqlJs, { type Database, QueryExecResult } from 'sql.js';
import { DokkanID, CardBasicInfo, DokkanPatchState, CardForm, CardUniqueInfo, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, CardSpecial, CardActiveSkill } from '../types';
import { INITIAL_CARD_FORM, generateLocalId } from '../constants';

let SQL: initSqlJs.SqlJsStatic | null = null;

const initializeSqlJs = async (): Promise<initSqlJs.SqlJsStatic> => {
  if (!SQL) {
    try {
      SQL = await initSqlJs({ locateFile: file => `https://unpkg.com/sql.js@1.10.3/dist/${file}` });
    } catch (error) {
      console.error("Failed to initialize sql.js:", error);
      throw new Error("Failed to initialize SQL.js. Check network connection or browser compatibility.");
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
    console.error("Error creating database from file buffer:", error);
    throw new Error("Invalid or corrupted database file.");
  }
};

const resultsToObjects = (results: QueryExecResult[]): Record<string, any>[] => {
  if (!results || results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map(row => {
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
    idFilter: 'all' | 'base' | 'transformed'
): Promise<CardBasicInfo[]> => {
  if (!nameQuery.trim()) return [];

  let query = `
    SELECT c.id, c.name, c.rarity, c.element 
    FROM cards c
    WHERE (c.name LIKE ? OR c.id LIKE ?)
  `;
  const params: (string | number)[] = [`%${nameQuery}%`, `${nameQuery}%`];

  if (elementFilter !== null) {
    const baseElement = elementFilter % 10; // 0 for AGL types, 1 for TEQ types etc.
    if (elementFilter < 10) { // User selected a "Neutral" type (0-4), search all its variants
      query += " AND (c.element = ? OR c.element = ? OR c.element = ?)";
      params.push(baseElement);         // Neutral (e.g., 0 for AGL)
      params.push(baseElement + 10);    // Super (e.g., 10 for Super AGL)
      params.push(baseElement + 20);    // Extreme (e.g., 20 for Extreme AGL)
    } else { // User selected a specific Super (10-14) or Extreme (20-24) type
      query += " AND c.element = ?";
      params.push(elementFilter);
    }
  }

  if (rarityFilter !== null) {
    query += " AND c.rarity = ?";
    params.push(rarityFilter);
  }

  // Apply idFilter (prefix-based)
  if (idFilter === 'base') { // Typically IDs starting with '1'
    query += " AND SUBSTR(c.id, 1, 1) = '1'";
  } else if (idFilter === 'transformed') { // Typically IDs NOT starting with '1' (e.g. '4')
    query += " AND SUBSTR(c.id, 1, 1) != '1'";
  }
  // 'all' doesn't add an ID prefix-based condition here.

  query += `
    ORDER BY c.name ASC, c.id ASC
    LIMIT 200; 
  `; // Fetch more to allow for 0/1 filtering
  
  try {
    const dbResults = db.exec(query, params);
    const initialResults = resultsToObjects(dbResults).map(row => ({
        id: String(row.id),
        name: String(row.name),
        rarity: Number(row.rarity),
        element: Number(row.element),
    })) as CardBasicInfo[];

    // Post-processing for '0' vs '1' ID versions
    const candidates = new Map<string, CardBasicInfo>(); // baseId (e.g. "102030") -> preferred CardBasicInfo

    for (const card of initialResults) {
        const idStr = card.id;
        if (idStr.length > 1) { // Ensure ID is long enough for a suffix
            const basePart = idStr.substring(0, idStr.length - 1);
            const suffix = idStr.substring(idStr.length - 1);

            if (suffix === '1') {
                candidates.set(basePart, card); // '1' version takes precedence
            } else if (suffix === '0') {
                if (!candidates.has(basePart)) { // If '1' version isn't already there
                    candidates.set(basePart, card);
                }
            } else {
                // If ID doesn't end in '0' or '1', treat it as unique within its own "base"
                if (!candidates.has(idStr)) { // Avoid overwriting if it was already added
                     candidates.set(idStr, card); // Use full ID as key
                }
            }
        } else {
            // Short ID, treat as unique
            if (!candidates.has(idStr)) {
                 candidates.set(idStr, card);
            }
        }
    }
    
    // Convert map values to array and sort for consistent display
    const finalDisplayList = Array.from(candidates.values()).sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
    }).slice(0, 50); // Limit final display

    return finalDisplayList;

  } catch (e) {
    console.error("DB search error:", e);
    throw new Error("Failed to search characters in the database.");
  }
};

const getVal = <T>(val: any, defaultVal: T): T => (val !== null && val !== undefined ? val : defaultVal);

const mapDbRowToPassiveSkill = (dbRow: Record<string, any>): PassiveSkill => ({
  id: String(dbRow.id),
  name: getVal(dbRow.name, ''),
  description: getVal(dbRow.description, ''),
  exec_timing_type: getVal(dbRow.exec_timing_type, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id ? String(dbRow.sub_target_type_set_id) : null,
  passive_skill_effect_id: dbRow.passive_skill_effect_id ? String(dbRow.passive_skill_effect_id) : null,
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

const mapDbRowToLeaderSkill = (dbRow: Record<string, any>, leader_skill_set_id: DokkanID): LeaderSkill => ({
  id: String(dbRow.id),
  leader_skill_set_id: leader_skill_set_id,
  exec_timing_type: getVal(dbRow.exec_timing_type, 0),
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id ? String(dbRow.sub_target_type_set_id) : null,
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

const mapDbRowToActiveSkillEffect = (dbRow: Record<string, any>, active_skill_set_id: DokkanID): ActiveSkillEffect => ({
  id: String(dbRow.id),
  active_skill_set_id: active_skill_set_id,
  target_type: getVal(dbRow.target_type, 0),
  sub_target_type_set_id: dbRow.sub_target_type_set_id ? String(dbRow.sub_target_type_set_id) : null,
  calc_option: getVal(dbRow.calc_option, 0),
  efficacy_type: getVal(dbRow.efficacy_type, 0),
  eff_val1: dbRow.eff_val1,
  eff_val2: dbRow.eff_val2,
  eff_val3: dbRow.eff_val3,
  efficacy_values: getVal(dbRow.efficacy_values, '{}'),
  thumb_effect_id: dbRow.thumb_effect_id ? Number(dbRow.thumb_effect_id) : null,
  effect_se_id: dbRow.effect_se_id ? Number(dbRow.effect_se_id) : null,
});

// Helper to fetch details for a single card form and its related skills
const _fetchSingleCardFormDetails = async (db: Database, cardId: DokkanID): Promise<Partial<DokkanPatchState> | null> => {
    const cardResults = db.exec("SELECT * FROM cards WHERE id = ?", [cardId]);
    const dbCard = resultsToObjects(cardResults)[0];
    if (!dbCard) return null;

    let cardUniqueInfo: CardUniqueInfo | undefined;
    if (dbCard.card_unique_info_id) {
      const cuiResults = db.exec("SELECT * FROM card_unique_infos WHERE id = ?", [dbCard.card_unique_info_id]);
      const dbCui = resultsToObjects(cuiResults)[0];
      if (dbCui) {
        cardUniqueInfo = {
            id: String(dbCui.id),
            name: getVal(dbCui.name, ''),
            kana: dbCui.kana ? String(dbCui.kana) : null,
        };
      }
    }
    if (!cardUniqueInfo && dbCard.card_unique_info_id) { // If CUI ID exists but no record, create a placeholder
        cardUniqueInfo = { id: String(dbCard.card_unique_info_id), name: String(dbCard.name || `Unique Info for ${cardId}`)};
    }


    const cardForm: CardForm = {
      ...INITIAL_CARD_FORM(),
      id: String(dbCard.id),
      name: getVal(dbCard.name, ''),
      character_id: String(dbCard.character_id),
      card_unique_info_id: String(dbCard.card_unique_info_id),
      cost: getVal(dbCard.cost, 0),
      rarity: getVal(dbCard.rarity, 4),
      hp_init: getVal(dbCard.hp_init, 0), hp_max: getVal(dbCard.hp_max, 0),
      atk_init: getVal(dbCard.atk_init, 0), atk_max: getVal(dbCard.atk_max, 0),
      def_init: getVal(dbCard.def_init, 0), def_max: getVal(dbCard.def_max, 0),
      element: getVal(dbCard.element, 0), // Keep the full element value (0-24)
      lv_max: getVal(dbCard.lv_max, 120),
      skill_lv_max: getVal(dbCard.skill_lv_max, 10),
      grow_type: getVal(dbCard.grow_type, 0),
      price: getVal(dbCard.price, 0),
      exp_type: getVal(dbCard.exp_type, 0),
      training_exp: getVal(dbCard.training_exp, 0),
      special_motion: getVal(dbCard.special_motion, 0),
      passive_skill_set_id: String(dbCard.passive_skill_set_id || ''),
      leader_skill_set_id: String(dbCard.leader_skill_set_id || ''),
      link_skill_ids: [
        dbCard.link_skill1_id, dbCard.link_skill2_id, dbCard.link_skill3_id,
        dbCard.link_skill4_id, dbCard.link_skill5_id, dbCard.link_skill6_id,
        dbCard.link_skill7_id
      ].map(id => String(id || '')).filter(id => id && id !== "null" && id.trim() !== '' && id.trim() !== "0"),
      category_ids: [], // Filled below
      eball_mod_min: getVal(dbCard.eball_mod_min, 0), eball_mod_num100: getVal(dbCard.eball_mod_num100, 0),
      eball_mod_mid: getVal(dbCard.eball_mod_mid, 0), eball_mod_mid_num: getVal(dbCard.eball_mod_mid_num, 0),
      eball_mod_max: getVal(dbCard.eball_mod_max, 0), eball_mod_max_num: getVal(dbCard.eball_mod_max_num, 0),
      max_level_reward_id: String(dbCard.max_level_reward_id || '1'),
      max_level_reward_type: String(dbCard.max_level_reward_type || '1'),
      collectable_type: getVal(dbCard.collectable_type, 1),
      face_x: getVal(dbCard.face_x, 0), face_y: getVal(dbCard.face_y, 0),
      aura_id: dbCard.aura_id ? String(dbCard.aura_id) : null,
      is_selling_only: getVal(dbCard.is_selling_only, 0),
      awakening_element_type: dbCard.awakening_element_type,
      potential_board_id: dbCard.potential_board_id ? String(dbCard.potential_board_id) : null,
      special_set_id_ref: '', 
      special_view_id: 0,   
      active_skill_set_id_ref: '',
    };

    const catResults = db.exec("SELECT card_category_id FROM card_card_categories WHERE card_id = ? ORDER BY num", [cardId]);
    cardForm.category_ids = resultsToObjects(catResults).map(row => String(row.card_category_id));

    const formPassiveSkillSets: PassiveSkillSet[] = [];
    const formLeaderSkillSets: LeaderSkillSet[] = [];
    const formSpecialSets: SpecialSet[] = [];
    const formActiveSkillSets: ActiveSkillSet[] = [];

    if (dbCard.passive_skill_set_id) {
      const pssResults = db.exec("SELECT * FROM passive_skill_sets WHERE id = ?", [dbCard.passive_skill_set_id]);
      const dbPss = resultsToObjects(pssResults)[0];
      if (dbPss) {
        const skillRelations = db.exec("SELECT passive_skill_id FROM passive_skill_set_relations WHERE passive_skill_set_id = ? ORDER BY passive_skill_id", [dbPss.id]); 
        const skillIds = resultsToObjects(skillRelations).map(r => String(r.passive_skill_id)).filter(id => id && id.trim() !== '');
        let skills: PassiveSkill[] = [];
        if (skillIds.length > 0) {
           const psSkillsResults = db.exec(`SELECT * FROM passive_skills WHERE id IN (${skillIds.map(() => '?').join(',')}) ORDER BY id`, skillIds); 
           skills = resultsToObjects(psSkillsResults).map(mapDbRowToPassiveSkill);
        }
        formPassiveSkillSets.push({ 
            id: String(dbPss.id), name: getVal(dbPss.name, ''), description: getVal(dbPss.description, ''),
            itemized_description: dbPss.itemized_description ? String(dbPss.itemized_description) : null, skills 
        });
      }
    }
    
    if (dbCard.leader_skill_set_id) {
      const lssResults = db.exec("SELECT * FROM leader_skill_sets WHERE id = ?", [dbCard.leader_skill_set_id]);
      const dbLss = resultsToObjects(lssResults)[0];
      if (dbLss) {
        const leaderSkillSetId = String(dbLss.id);
        const lsSkillsResults = db.exec("SELECT * FROM leader_skills WHERE leader_skill_set_id = ? ORDER BY id", [leaderSkillSetId]); 
        const skills = resultsToObjects(lsSkillsResults).map(s => mapDbRowToLeaderSkill(s, leaderSkillSetId));
        formLeaderSkillSets.push({ 
            id: leaderSkillSetId, name: getVal(dbLss.name, ''), description: getVal(dbLss.description, ''), skills 
        });
      }
    }

    const cardSpecialResults = db.exec("SELECT * FROM card_specials WHERE card_id = ? ORDER BY priority LIMIT 1", [cardId]);
    const dbCardSpecial = resultsToObjects(cardSpecialResults)[0] as CardSpecial | undefined;

    if (dbCardSpecial && dbCardSpecial.special_set_id) {
      cardForm.special_set_id_ref = String(dbCardSpecial.special_set_id);
      cardForm.special_view_id = getVal(dbCardSpecial.view_id, 0);
      
      const ssResults = db.exec("SELECT * FROM special_sets WHERE id = ?", [dbCardSpecial.special_set_id]);
      const dbSs = resultsToObjects(ssResults)[0];
      if (dbSs) {
        const specialSetId = String(dbSs.id);
        const sSkillsResults = db.exec("SELECT * FROM specials WHERE special_set_id = ? ORDER BY id", [specialSetId]); 
        const skills = resultsToObjects(sSkillsResults).map(s => mapDbRowToSpecial(s, specialSetId));
        formSpecialSets.push({ 
            id: specialSetId, name: getVal(dbSs.name, ''), description: getVal(dbSs.description, ''),
            causality_description: dbSs.causality_description ? String(dbSs.causality_description) : null,
            aim_target: getVal(dbSs.aim_target, 0), increase_rate: getVal(dbSs.increase_rate, 0),
            lv_bonus: getVal(dbSs.lv_bonus, 0), is_inactive: getVal(dbSs.is_inactive, 0), skills 
        });
      }
    }
    
    const cardActiveSkillResults = db.exec("SELECT * FROM card_active_skills WHERE card_id = ? LIMIT 1", [cardId]);
    const dbCardActiveSkill = resultsToObjects(cardActiveSkillResults)[0] as CardActiveSkill | undefined;

    if (dbCardActiveSkill && dbCardActiveSkill.active_skill_set_id) {
      cardForm.active_skill_set_id_ref = String(dbCardActiveSkill.active_skill_set_id);
      
      const asResults = db.exec("SELECT * FROM active_skill_sets WHERE id = ?", [dbCardActiveSkill.active_skill_set_id]);
      const dbAs = resultsToObjects(asResults)[0];
      if (dbAs) {
        const activeSkillSetId = String(dbAs.id);
        const aSkillsResults = db.exec("SELECT * FROM active_skills WHERE active_skill_set_id = ? ORDER BY id", [activeSkillSetId]); 
        const skills = resultsToObjects(aSkillsResults).map(s => mapDbRowToActiveSkillEffect(s, activeSkillSetId));
        formActiveSkillSets.push({ 
            id: activeSkillSetId, name: getVal(dbAs.name, ''), effect_description: getVal(dbAs.effect_description, ''),
            condition_description: getVal(dbAs.condition_description, ''), turn: getVal(dbAs.turn, 0),
            exec_limit: getVal(dbAs.exec_limit, 0),
            causality_conditions: dbAs.causality_conditions ? String(dbAs.causality_conditions) : null,
            ultimate_special_id: dbAs.ultimate_special_id ? Number(dbAs.ultimate_special_id) : null,
            special_view_id: dbAs.special_view_id ? Number(dbAs.special_view_id) : null,
            costume_special_view_id: dbAs.costume_special_view_id ? Number(dbAs.costume_special_view_id) : null,
            bgm_id: dbAs.bgm_id ? Number(dbAs.bgm_id) : null, skills 
        });
      }
    }
    
    return {
      cardForms: [cardForm],
      cardUniqueInfos: cardUniqueInfo ? [cardUniqueInfo] : [],
      passiveSkillSets: formPassiveSkillSets,
      leaderSkillSets: formLeaderSkillSets,
      specialSets: formSpecialSets,
      activeSkillSets: formActiveSkillSets,
    };
};


export const getCharacterDetails = async (db: Database, selectedCardId: DokkanID): Promise<DokkanPatchState | null> => {
  try {
    const baseIdStr = selectedCardId.substring(0, selectedCardId.length - 1);
    const idFor0 = baseIdStr + "0";
    const idFor1 = baseIdStr + "1";

    const details0 = await _fetchSingleCardFormDetails(db, idFor0);
    const details1 = await _fetchSingleCardFormDetails(db, idFor1);

    if (!details0 && !details1) {
      // If neither form is found, try fetching the originally selected ID directly
      // This handles cases where the ID doesn't follow the 0/1 pattern or only one was intended.
      const singleDetails = await _fetchSingleCardFormDetails(db, selectedCardId);
      if (!singleDetails) return null;
      return {
          cardForms: singleDetails.cardForms || [],
          cardUniqueInfos: singleDetails.cardUniqueInfos || [],
          passiveSkillSets: singleDetails.passiveSkillSets || [],
          leaderSkillSets: singleDetails.leaderSkillSets || [],
          specialSets: singleDetails.specialSets || [],
          activeSkillSets: singleDetails.activeSkillSets || [],
          passiveSkillEffects: [],
          effectPacks: [],
          isEZA: false,
      };
    }
    
    const finalCardForms: CardForm[] = [];
    if (details0?.cardForms?.[0]) finalCardForms.push(details0.cardForms[0]);
    if (details1?.cardForms?.[0]) finalCardForms.push(details1.cardForms[0]);

    if (finalCardForms.length === 0) return null; // Should not happen if details0 or details1 is non-null

    const mergedUniqueInfos = new Map<DokkanID, CardUniqueInfo>();
    const mergedPassiveSets = new Map<DokkanID, PassiveSkillSet>();
    const mergedLeaderSets = new Map<DokkanID, LeaderSkillSet>();
    const mergedSpecialSets = new Map<DokkanID, SpecialSet>();
    const mergedActiveSets = new Map<DokkanID, ActiveSkillSet>();

    const addToMap = <T extends {id: DokkanID}>(map: Map<DokkanID, T>, items?: T[]) => {
        items?.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
    };

    addToMap(mergedUniqueInfos, details0?.cardUniqueInfos);
    addToMap(mergedUniqueInfos, details1?.cardUniqueInfos);
    
    addToMap(mergedPassiveSets, details0?.passiveSkillSets);
    addToMap(mergedPassiveSets, details1?.passiveSkillSets);

    addToMap(mergedLeaderSets, details0?.leaderSkillSets);
    addToMap(mergedLeaderSets, details1?.leaderSkillSets);

    addToMap(mergedSpecialSets, details0?.specialSets);
    addToMap(mergedSpecialSets, details1?.specialSets);

    addToMap(mergedActiveSets, details0?.activeSkillSets);
    addToMap(mergedActiveSets, details1?.activeSkillSets);

    return {
      cardForms: finalCardForms,
      cardUniqueInfos: Array.from(mergedUniqueInfos.values()),
      passiveSkillSets: Array.from(mergedPassiveSets.values()),
      leaderSkillSets: Array.from(mergedLeaderSets.values()),
      specialSets: Array.from(mergedSpecialSets.values()),
      activeSkillSets: Array.from(mergedActiveSets.values()),
      passiveSkillEffects: [], 
      effectPacks: [],       
      isEZA: false,          
    };

  } catch (e) {
    console.error(`Error fetching details for card forms related to ${selectedCardId}:`, e);
    throw new Error(`Failed to fetch details for card forms. ${e instanceof Error ? e.message : ''}`);
  }
};
