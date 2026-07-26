import { DokkanPatchState, CardCategoryEntry, DokkanID } from '../types';
import { DOKKAN_TABLE_COLUMNS } from '../constants';

const getCurrentSqlTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  const microseconds = (milliseconds + '000').slice(0, 6);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${microseconds}`;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
};

const getDefaultValue = (tableName: string, columnName: string, data: Record<string, any>): any => {
  // First, check if the data object explicitly has the property and it's not undefined or null
  // (unless it's a link_skill_id which can be an intentional empty string that needs to become null)
  if (
    Object.prototype.hasOwnProperty.call(data, columnName) &&
    data[columnName] !== undefined &&
    data[columnName] !== null
  ) {
    if (
      tableName === 'cards' &&
      columnName.startsWith('link_skill') &&
      columnName.endsWith('_id') &&
      data[columnName] === ''
    ) {
      return null; // Convert empty string for link skills to NULL
    }
    // If data[columnName] is an empty string, check if this column should treat '' as NULL
    if (data[columnName] === '') {
      const treatEmptyStringAsNullColumns = [
        // Eff values (numeric or string, but can be null)
        'eff_value1',
        'eff_value2',
        'eff_value3',
        'eff_val1',
        'eff_val2',
        'eff_val3',
        // Nullable FKs / ID refs (string or numeric IDs, can be null)
        'sub_target_type_set_id',
        'passive_skill_effect_id',
        'ultimate_special_id',
        'special_view_id',
        'bgm_id',
        'thumb_effect_id',
        'effect_se_id',
        'finish_special_id',
        'aura_id',
        'optimal_awakening_grow_type',
        'potential_board_id',
        'special_asset_id',
        'kana',
        // Nullable text fields that are structured (e.g., JSON) or specific meaning
        'causality_conditions',
        'itemized_description',
        'description', // Now includes the main description field
        'causality_description',
        'target_type_values',
        'dialog_images',
        // calc_option for Standby/Finish skills (string | null)
        // This needs table context or to assume 'calc_option' when empty means null
        // For now, let's list it, and if it's a non-nullable number elsewhere, it won't be ''
        'calc_option',
      ];
      if (treatEmptyStringAsNullColumns.includes(columnName)) {
        return null;
      }
    }
    return data[columnName]; // Return the value as is if not empty or not specially handled
  }

  // Default values if data[columnName] is null, undefined, or not present
  if (columnName === 'created_at' || columnName === 'updated_at') {
    if (tableName === 'card_active_skills') {
      return 0;
    }
    return getCurrentSqlTimestamp();
  }
  if (columnName === 'open_at' && tableName === 'cards') {
    return 0;
  }

  if (tableName === 'cards') {
    if (columnName.startsWith('link_skill') && columnName.endsWith('_id')) {
      const linkSkillIds = data.link_skill_ids as DokkanID[] | undefined;
      if (linkSkillIds) {
        const index = parseInt(columnName.replace('link_skill', '').replace('_id', '')) - 1;
        if (
          index >= 0 &&
          index < linkSkillIds.length &&
          linkSkillIds[index] &&
          linkSkillIds[index] !== ''
        ) {
          return linkSkillIds[index];
        }
      }
      return null;
    }
    if (
      [
        'optimal_awakening_grow_type',
        'aura_id',
        'aura_scale',
        'aura_offset_x',
        'aura_offset_y',
        'awakening_number',
        'resource_id',
        'bg_effect_id',
        'awakening_element_type',
        'potential_board_id',
      ].includes(columnName)
    ) {
      return null;
    }
    if (columnName === 'is_aura_front') return 0;
  }

  if (tableName === 'card_unique_infos' && columnName === 'kana') return null;

  if (
    [
      'leader_skills',
      'specials',
      'active_skill_sets',
      'standby_skill_sets',
      'finish_skill_sets',
    ].includes(tableName) &&
    columnName === 'causality_conditions'
  )
    return null;

  if (tableName === 'leader_skills' && columnName === 'sub_target_type_set_id') return null;

  if (tableName === 'passive_skill_sets' && columnName === 'itemized_description') return null;

  if (tableName === 'passive_skills') {
    if (columnName === 'efficacy_values') return '{}';
    if (
      ['sub_target_type_set_id', 'passive_skill_effect_id', 'causality_conditions'].includes(
        columnName
      )
    )
      return null;
    if (
      ['eff_value1', 'eff_value2', 'eff_value3'].includes(columnName) &&
      data[columnName] === undefined
    )
      return null; // Default to null if not present
  }

  if (['leader_skill_sets', 'special_sets'].includes(tableName) && columnName === 'description')
    return null;
  if (tableName === 'special_sets' && columnName === 'causality_description') return null;

  if (tableName === 'active_skill_sets') {
    if (columnName === 'costume_special_view_id') return 0;
    if (
      ['ultimate_special_id', 'special_view_id', 'bgm_id', 'causality_conditions'].includes(
        columnName
      )
    )
      return null;
  }

  if (tableName === 'active_skills') {
    if (columnName === 'efficacy_values') return '{}';
    if (['sub_target_type_set_id', 'thumb_effect_id', 'effect_se_id'].includes(columnName))
      return null;
    if (['eff_val1', 'eff_val2', 'eff_val3'].includes(columnName) && data[columnName] === undefined)
      return null; // Default to null if not present
    if (columnName === 'calc_option' && data[columnName] === undefined) return null; // if calc_option can be truly null for active_skills
  }

  if (tableName === 'card_specials') {
    if (['causality_conditions', 'special_asset_id'].includes(columnName)) return null;
  }

  if (tableName === 'passive_skill_effects' && columnName === 'bgm_id') return null;

  if (tableName === 'standby_skill_sets') {
    if (columnName === 'costume_special_view_id') return 0;
    if (['special_view_id', 'bgm_id', 'causality_conditions'].includes(columnName)) return null;
  }
  if (tableName === 'standby_skills') {
    if (columnName === 'target_type_values') return '{}'; // Default to empty JSON string if not null
    if (columnName === 'efficacy_values') return '{}';
    if (
      ['sub_target_type_set_id', 'calc_option', 'thumb_effect_id', 'effect_se_id'].includes(
        columnName
      )
    )
      return null;
    if (['eff_val1', 'eff_val2', 'eff_val3'].includes(columnName) && data[columnName] === undefined)
      return null;
  }
  if (tableName === 'finish_skill_sets') {
    if (columnName === 'dialog_order') return 0;
    if (columnName === 'exec_timing_type') return 0;
    if (columnName === 'costume_special_view_id') return 0;
    if (columnName === 'is_dialog_view_visible') return 1;
    if (
      [
        'dialog_images',
        'finish_special_id',
        'special_view_id',
        'bgm_id',
        'causality_conditions',
      ].includes(columnName)
    )
      return null;
  }
  if (tableName === 'finish_skills') {
    if (columnName === 'target_type_values') return '{}';
    if (columnName === 'efficacy_values') return '{}';
    if (
      ['sub_target_type_set_id', 'calc_option', 'thumb_effect_id', 'effect_se_id'].includes(
        columnName
      )
    )
      return null;
    if (['eff_val1', 'eff_val2', 'eff_val3'].includes(columnName) && data[columnName] === undefined)
      return null;
  }

  if (tableName === 'sub_target_type_sets') {
    // No special defaults needed yet
  }

  if (tableName === 'sub_target_types') {
    // No special defaults needed yet
  }



  return undefined; // Let formatValue handle undefined as NULL
};

const generateInsertOrReplace = (tableName: string, data: Record<string, any>): string => {
  const definedColumns = DOKKAN_TABLE_COLUMNS[tableName];
  if (!definedColumns) {
    console.warn(
      `WARN: No column definition for table ${tableName}. Could not generate SQL for: ${JSON.stringify(data)}`
    );
    return `-- WARN: No column definition for table ${tableName}. Could not generate SQL for: ${JSON.stringify(data)}\n`;
  }

  const columnNamesForSql = definedColumns.map((c) => `"${c}"`).join(', ');

  const valuesForSql = definedColumns
    .map((colName) => {
      const rawValue = getDefaultValue(tableName, colName, data);
      return formatValue(rawValue);
    })
    .join(', ');

  return `INSERT OR REPLACE INTO "main"."${tableName}" (${columnNamesForSql}) VALUES (${valuesForSql});\n`;
};

const extractIdsFromJson = (jsonString: string | null | undefined): Set<string> => {
  const ids = new Set<string>();
  if (!jsonString) return ids;

  try {
    const parsed = JSON.parse(jsonString);
    const traverse = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'object') {
        for (const key in obj) {
          traverse(obj[key]);
        }
      } else if (typeof obj === 'string' || typeof obj === 'number') {
        ids.add(String(obj));
      }
    };
    traverse(parsed);
  } catch (e) {
    // Ignore invalid JSON
  }
  return ids;
};

const collectUsedCausalityIds = (state: DokkanPatchState): Set<string> => {
  const usedIds = new Set<string>();

  const check = (jsonStr: string | null | undefined) => {
    const extracted = extractIdsFromJson(jsonStr);
    extracted.forEach((id) => usedIds.add(id));
  };

  state.passiveSkillSets.forEach((set) => {
    set.skills.forEach((skill) => check(skill.causality_conditions));
  });

  state.leaderSkillSets.forEach((set) => {
    set.skills.forEach((skill) => check(skill.causality_conditions));
  });

  state.specialSets.forEach((set) => {
    set.skills.forEach((skill) => check(skill.causality_conditions));
  });

  state.activeSkillSets.forEach((set) => {
    check(set.causality_conditions);
  });

  state.standbySkillSets.forEach((set) => {
    check(set.causality_conditions);
  });

  state.finishSkillSets.forEach((set) => {
    check(set.causality_conditions);
  });

  state.cardSpecials.forEach((cs) => {
    check(cs.causality_conditions);
  });

  return usedIds;
};

export const generateSqlPatch = (state: DokkanPatchState): string => {
  let sql = '-- Dokkan Battle Patch Generated --\n\n';

  // --- Cards, Unique Infos, Categories (As per user's example) ---
  sql += '-- cards\n';
  const cardCategoriesToGenerate: CardCategoryEntry[] = [];
  state.cardForms.forEach((form) => {
    sql += generateInsertOrReplace('cards', form);
    (form.category_ids || []).forEach((catId, index) => {
      if (catId && catId.trim() !== '') {
        const categoryEntryId = `${form.id}${(index + 1).toString().padStart(3, '0')}`;
        cardCategoriesToGenerate.push({
          id: categoryEntryId,
          card_id: form.id,
          card_category_id: catId,
          num: index + 1,
        });
      }
    });
  });
  sql += '\n';

  if (state.characters && state.characters.length > 0) {
    sql += '-- characters\n';
    state.characters.forEach((char) => {
      sql += generateInsertOrReplace('characters', char);
    });
    sql += '\n';
  }

  sql += '-- card_unique_infos\n';
  state.cardUniqueInfos.forEach((info) => {
    sql += generateInsertOrReplace('card_unique_infos', info);
  });
  sql += '\n';

  // --- Optimal Awakening Growth (early if EZA) ---
  if (state.isEZA && state.optimalAwakeningGrowth) {
    sql += '-- optimal_awakening_growths (EZA)\n';
    sql += generateInsertOrReplace('optimal_awakening_growths', state.optimalAwakeningGrowth);
    sql += '\n';
  }

  if (cardCategoriesToGenerate.length > 0) {
    sql += '-- card_card_categories\n';
    cardCategoriesToGenerate.forEach((catEntry) => {
      sql += generateInsertOrReplace('card_card_categories', catEntry);
    });
    sql += '\n';
  }

  // --- Leader Skills ---
  sql += '-- leader_skill_sets\n';
  state.leaderSkillSets.forEach((set) => {
    sql += generateInsertOrReplace('leader_skill_sets', set);
    sql += '-- leader_skills for set ' + set.id + '\n';
    set.skills.forEach((skill) => {
      const skillData = { ...skill, leader_skill_set_id: set.id };
      sql += generateInsertOrReplace('leader_skills', skillData);
    });
  });
  sql += '\n';

  // --- Passive Skills ---
  sql += '-- passive_skill_sets\n';
  const passiveSkillSetRelationsToGenerate: {
    id: DokkanID;
    passive_skill_set_id: DokkanID;
    passive_skill_id: DokkanID;
  }[] = [];
  state.passiveSkillSets.forEach((set) => {
    const passiveSetData = {
      id: set.id,
      name: set.name,
      itemized_description: set.itemized_description,
    };
    sql += generateInsertOrReplace('passive_skill_sets', passiveSetData);
    sql += '-- passive_skills for set ' + set.id + '\n';
    set.skills.forEach((skill, skillIndex) => {
      sql += generateInsertOrReplace('passive_skills', skill);
      passiveSkillSetRelationsToGenerate.push({
        id: `${set.id}${skillIndex.toString().padStart(4, '0')}`,
        passive_skill_set_id: set.id,
        passive_skill_id: skill.id,
      });
    });
  });
  sql += '\n';

  if (passiveSkillSetRelationsToGenerate.length > 0) {
    sql += '-- passive_skill_set_relations\n';
    passiveSkillSetRelationsToGenerate.forEach((relation) => {
      sql += generateInsertOrReplace('passive_skill_set_relations', relation);
    });
    sql += '\n';
  }

  // --- Special Skills & Card Specials ---
  sql += '-- special_sets\n';
  state.specialSets.forEach((set) => {
    sql += generateInsertOrReplace('special_sets', set);
    sql += '-- specials for set ' + set.id + '\n';
    set.skills.forEach((skill) => {
      const skillData = { ...skill, special_set_id: set.id };
      sql += generateInsertOrReplace('specials', skillData);
    });
  });
  sql += '\n';

  if (state.cardSpecials && state.cardSpecials.length > 0) {
    sql += '-- card_specials\n';
    state.cardSpecials.forEach((cs) => {
      sql += generateInsertOrReplace('card_specials', cs);
    });
    sql += '\n';
  }

  // --- Passive Skill Effects & Effect Packs (as per user's example order) ---
  if (state.passiveSkillEffects && state.passiveSkillEffects.length > 0) {
    sql += '-- passive_skill_effects\n'; // Corrected comment from "Passive Skill Effects"
    state.passiveSkillEffects.forEach((pse) => {
      sql += generateInsertOrReplace('passive_skill_effects', pse);
    });
    sql += '\n';
  }

  if (state.effectPacks && state.effectPacks.length > 0) {
    sql += '-- effect_packs\n';
    state.effectPacks.forEach((ep) => {
      sql += generateInsertOrReplace('effect_packs', ep);
    });
    sql += '\n';
  }

  // --- Active Skills & Card Active Skills ---
  sql += '-- active_skill_sets\n';
  state.activeSkillSets.forEach((set) => {
    sql += generateInsertOrReplace('active_skill_sets', {
      id: set.id,
      name: set.name,
      effect_description: set.effect_description,
      condition_description: set.condition_description,
      turn: set.turn,
      exec_limit: set.exec_limit,
      causality_conditions: set.causality_conditions,
      ultimate_special_id: set.ultimate_special_id,
      special_view_id: set.special_view_id,
      costume_special_view_id: set.costume_special_view_id,
      bgm_id: set.bgm_id,
    });
    sql += '-- active_skills for set ' + set.id + '\n';
    set.skills.forEach((skill) => {
      const skillData = { ...skill, active_skill_set_id: set.id };
      sql += generateInsertOrReplace('active_skills', skillData);
    });
  });
  sql += '\n';

  // --- Card Active Skills (Junction Table) ---
  if (state.cardActiveSkills && state.cardActiveSkills.length > 0) {
    sql += '-- card_active_skills\n';
    state.cardActiveSkills.forEach((casEntry) => {
      const cardIdForSql = casEntry.card_id;
      const activeSkillSetIdForSql = casEntry.active_skill_set_id;

      let idForSqlRow: string;
      if (cardIdForSql.endsWith('1')) {
        idForSqlRow = activeSkillSetIdForSql + '1';
      } else {
        idForSqlRow = activeSkillSetIdForSql;
      }

      const dataForRow = {
        id: idForSqlRow,
        card_id: cardIdForSql,
        active_skill_set_id: activeSkillSetIdForSql,
        // created_at and updated_at will be set to 0 by getDefaultValue
      };
      sql += generateInsertOrReplace('card_active_skills', dataForRow);
    });
    sql += '\n';
  }

  // --- Standby Skills & Relations ---
  if (state.standbySkillSets && state.standbySkillSets.length > 0) {
    sql += '-- standby_skill_sets\n';
    state.standbySkillSets.forEach((set) => {
      const standbySetData = {
        id: set.id,
        name: set.name,
        ingame_icon_path: set.ingame_icon_path,
        effect_description: set.effect_description,
        condition_description: set.condition_description,
        exec_limit: set.exec_limit,
        causality_conditions: set.causality_conditions,
        special_view_id: set.special_view_id,
        costume_special_view_id: set.costume_special_view_id,
        bgm_id: set.bgm_id,
      };
      sql += generateInsertOrReplace('standby_skill_sets', standbySetData);
      sql += '-- standby_skills for set ' + set.id + '\n';
      set.skills.forEach((skill) => {
        const skillData = { ...skill, standby_skill_set_id: set.id };
        sql += generateInsertOrReplace('standby_skills', skillData);
      });
    });
    sql += '\n';
  }

  if (state.cardStandbySkills && state.cardStandbySkills.length > 0) {
    sql += '-- card_standby_skill_set_relations\n';
    state.cardStandbySkills.forEach((css) => {
      sql += generateInsertOrReplace('card_standby_skill_set_relations', css);
    });
    sql += '\n';
  }

  // --- Finish Skills & Relations ---
  if (state.finishSpecials && state.finishSpecials.length > 0) {
    sql += '-- finish_specials\n';
    state.finishSpecials.forEach((fs) => {
      sql += generateInsertOrReplace('finish_specials', fs);
    });
    sql += '\n';
  }

  if (state.finishSkillSets && state.finishSkillSets.length > 0) {
    sql += '-- finish_skill_sets\n';
    state.finishSkillSets.forEach((set) => {
      const finishSetData = {
        id: set.id,
        name: set.name,
        effect_description: set.effect_description,
        condition_description: set.condition_description,
        dialog_order: set.dialog_order,
        dialog_images: set.dialog_images,
        exec_timing_type: set.exec_timing_type,
        exec_limit: set.exec_limit,
        causality_conditions: set.causality_conditions,
        finish_special_id: set.finish_special_id,
        special_view_id: set.special_view_id,
        costume_special_view_id: set.costume_special_view_id,
        bgm_id: set.bgm_id,
        is_dialog_view_visible: set.is_dialog_view_visible,
      };
      sql += generateInsertOrReplace('finish_skill_sets', finishSetData);
      sql += '-- finish_skills for set ' + set.id + '\n';
      set.skills.forEach((skill) => {
        const skillData = { ...skill, finish_skill_set_id: set.id };
        sql += generateInsertOrReplace('finish_skills', skillData);
      });
    });
    sql += '\n';
  }

  if (
    state.standbySkillSetFinishSkillSetRelations &&
    state.standbySkillSetFinishSkillSetRelations.length > 0
  ) {
    sql += '-- standby_skill_set_finish_skill_set_relations\n';
    state.standbySkillSetFinishSkillSetRelations.forEach((rel) => {
      sql += generateInsertOrReplace('standby_skill_set_finish_skill_set_relations', rel);
    });
    sql += '\n';
  }

  // --- Battle Params ---
  if (state.battleParams && state.battleParams.length > 0) {
    sql += '-- battle_params\n';
    state.battleParams.forEach((bp) => {
      sql += generateInsertOrReplace('battle_params', bp);
    });
    sql += '\n';
  }

  // --- Skill Causalities ---
  if (state.skillCausalities && state.skillCausalities.length > 0) {
    const usedCausalityIds = collectUsedCausalityIds(state);
    const filteredCausalities = state.skillCausalities.filter(sc => usedCausalityIds.has(String(sc.id)));

    if (filteredCausalities.length > 0) {
      sql += '-- skill_causalities\n';
      filteredCausalities.forEach((sc) => {
        // Ensure values are formatted correctly for SQL (numbers vs strings)
        const causalityData = {
          id: sc.id,
          causality_type: sc.causality_type,
          cau_val1: sc.cau_val1,
          cau_val2: sc.cau_val2,
          cau_val3: sc.cau_val3
        };
        sql += generateInsertOrReplace('skill_causalities', causalityData);
      });
      sql += '\n';
    }
  }

  // --- Sub Target Type Sets & Sub Target Types ---
  if (state.subTargetTypeSets && state.subTargetTypeSets.length > 0) {
    sql += '-- sub_target_type_sets\n';
    state.subTargetTypeSets.forEach((set) => {
      sql += generateInsertOrReplace('sub_target_type_sets', set);
    });
    sql += '\n';
  }

  sql += '\n';


  // --- Ultimate Specials ---
  if (state.ultimateSpecials && state.ultimateSpecials.length > 0) {
    sql += '-- ultimate_specials\n';
    state.ultimateSpecials.forEach((us) => {
      sql += generateInsertOrReplace('ultimate_specials', us);
    });
    sql += '\n';
  }

  // --- Special Views ---
  if (state.specialViews && state.specialViews.length > 0) {
    sql += '-- special_views\n';
    state.specialViews.forEach((sv) => {
      sql += generateInsertOrReplace('special_views', sv);
    });
    sql += '\n';
  }

  // --- EZA Specific Update (Card Update at the end) ---
  // This section has been removed as per user request.
  // The optimal_awakening_growths table insert handles these changes.
  // if (state.isEZA && state.optimalAwakeningGrowth && state.baseCardIdForEZA && state.baseCardIdForEZA.length > 0) {
  //   const oag = state.optimalAwakeningGrowth;
  //   const currentTimestamp = formatValue(getCurrentSqlTimestamp());

  //   const idPrefix = state.baseCardIdForEZA.slice(0, -1);
  //   const targetId0 = idPrefix + "0";
  //   const targetId1 = idPrefix + "1";

  //   const updateSetClause = `
  //       "optimal_awakening_grow_type" = ${formatValue(oag.optimal_awakening_grow_type)},
  //       "lv_max" = ${formatValue(oag.lv_max)},
  //       "skill_lv_max" = ${formatValue(oag.skill_lv_max)},
  //       "passive_skill_set_id" = ${formatValue(oag.passive_skill_set_id)},
  //       "leader_skill_set_id" = ${formatValue(oag.leader_skill_set_id)},
  //       "updated_at" = ${currentTimestamp}`;

  //   sql += '-- EZA Card Updates\n';
  //   sql += `UPDATE "main"."cards" SET ${updateSetClause}
  //   WHERE "id" = ${formatValue(targetId0)};\n`;
  //   sql += `UPDATE "main"."cards" SET ${updateSetClause}
  //   WHERE "id" = ${formatValue(targetId1)};\n\n`;
  // }

  // --- Card Awakening Routes ---
  if (state.cardAwakeningRoutes && state.cardAwakeningRoutes.length > 0) {
    sql += '-- card_awakening_routes\n';
    state.cardAwakeningRoutes.forEach((car) => {
      sql += generateInsertOrReplace('card_awakening_routes', car);
    });
    sql += '\n';
  }

  sql += '-- End of Patch --\n';
  return sql;
};
