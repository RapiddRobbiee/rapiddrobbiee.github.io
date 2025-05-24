
// Fix: Import CardActiveSkill
import { DokkanPatchState, CardForm, CardUniqueInfo, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, OptimalAwakeningGrowth, CardCategoryEntry, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, CardSpecial, DokkanID, PassiveSkillEffectEntry, EffectPackEntry, CardActiveSkill } from '../types';
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
  // Constructing a 6-digit microsecond part from milliseconds
  const microseconds = (milliseconds + "000").slice(0,6); 
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${microseconds}`;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
};

const getDefaultValue = (tableName: string, columnName: string, data: Record<string, any>): any => {
  if (data.hasOwnProperty(columnName) && data[columnName] !== undefined) {
    // Specifically for link_skillX_id, if it's an empty string from data, treat as NULL
    if (tableName === 'cards' && columnName.startsWith('link_skill') && columnName.endsWith('_id') && data[columnName] === '') {
        return null;
    }
    return data[columnName];
  }

  // Use current timestamp for created_at and updated_at if not provided
  if (columnName === 'created_at' || columnName === 'updated_at') {
    return getCurrentSqlTimestamp();
  }
  // open_at defaults to 0
  if (columnName === 'open_at') {
    return 0;
  }


  if (tableName === 'cards') {
    if (columnName.startsWith('link_skill') && columnName.endsWith('_id')) {
      const linkSkillIds = data.link_skill_ids as DokkanID[] | undefined;
      if (linkSkillIds) {
        const index = parseInt(columnName.replace('link_skill', '').replace('_id', '')) - 1;
        if (index >= 0 && index < linkSkillIds.length && linkSkillIds[index] && linkSkillIds[index] !== '') {
          return linkSkillIds[index];
        }
      }
      return null;
    }
    if (['optimal_awakening_grow_type', 'aura_id', 'aura_scale', 'aura_offset_x', 'aura_offset_y', 'awakening_number', 'resource_id', 'bg_effect_id', 'awakening_element_type', 'potential_board_id'].includes(columnName)) {
      return null;
    }
    if (columnName === 'is_aura_front') return 0;
    if (columnName.startsWith('eball_mod_')) return 0;
    if (['price', 'exp_type', 'training_exp', 'selling_exchange_point', 'special_motion', 'cost', 'rarity', 'hp_init', 'hp_max', 'atk_init', 'atk_max', 'def_init', 'def_max', 'element', 'lv_max', 'skill_lv_max', 'grow_type', 'face_x', 'face_y', 'collectable_type', 'is_selling_only'].includes(columnName)){
        return 0; // Default numeric fields if not explicitly on data (should be from INITIAL_CARD_FORM)
    }
    if (['max_level_reward_id', 'max_level_reward_type'].includes(columnName)) return '1'; // Default from INITIAL_CARD_FORM

  }
  
  if (tableName === 'card_unique_infos' && columnName === 'kana') return null;
  
  if (tableName === 'leader_skills' || tableName === 'specials' || tableName === 'active_skill_sets') {
    if (columnName === 'causality_conditions') return null;
  }
  if (tableName === 'leader_skills' && columnName === 'sub_target_type_set_id') return null;

  if (tableName === 'passive_skill_sets' && columnName === 'itemized_description') return null;
  
  if (tableName === 'passive_skills') {
    if (columnName === 'efficacy_values') return '{}';
    if (['sub_target_type_set_id', 'passive_skill_effect_id', 'causality_conditions'].includes(columnName)) {
        return null;
    }
  }
  
  if (tableName === 'special_sets') {
      if (columnName === 'causality_description') return null;
  }

  if (tableName === 'active_skill_sets') {
      if (['ultimate_special_id', 'special_view_id', 'bgm_id'].includes(columnName)) return null;
      if (columnName === 'costume_special_view_id') return 0;
  }

  if (tableName === 'active_skills') {
      if (columnName === 'efficacy_values') return '{}';
      if (['sub_target_type_set_id', 'thumb_effect_id', 'effect_se_id'].includes(columnName)) return null;
  }

  if(tableName === 'card_specials'){
      if(['causality_conditions', 'special_asset_id'].includes(columnName)) return null;
      if(['priority', 'lv_start', 'card_costume_condition_id', 
          'special_bonus_id1', 'special_bonus_lv1', 'bonus_view_id1',
          'special_bonus_id2', 'special_bonus_lv2', 'bonus_view_id2'].includes(columnName)) return 0;
      if(columnName === 'style') return 'Normal';
      if(columnName === 'eball_num_start') return 12;
      // view_id can be 0, no specific default here if not provided, will be handled by data
  }

  // Fix: Modified structure around line 112 to use an if/else for the final condition.
  if (tableName === 'passive_skill_effects' && columnName === 'bgm_id') {
    return null;
  } else {
    return undefined; // Let formatValue handle to NULL if truly no default.
  }
};

const generateInsertOrReplace = (tableName: string, data: Record<string, any>): string => {
  const definedColumns = DOKKAN_TABLE_COLUMNS[tableName];
  if (!definedColumns) {
    console.warn(`No column definition for table ${tableName}. Skipping SQL for: ${JSON.stringify(data)}`);
    return `-- WARN: No column definition for table ${tableName}. Could not generate SQL for: ${JSON.stringify(data)}\n`;
  }

  const columnNamesForSql = definedColumns.map(c => `"${c}"`).join(', ');
  
  const valuesForSql = definedColumns.map(colName => {
    const rawValue = getDefaultValue(tableName, colName, data);
    return formatValue(rawValue);
  }).join(', ');
  
  return `INSERT OR REPLACE INTO "main"."${tableName}" (${columnNamesForSql}) VALUES (${valuesForSql});\n`;
};

export const generateSqlPatch = (state: DokkanPatchState): string => {
  let sql = '-- Dokkan Battle Patch Generated --\n\n';

  sql += '-- card unique infos\n';
  state.cardUniqueInfos.forEach(info => {
    sql += generateInsertOrReplace('card_unique_infos', info);
  });
  sql += '\n';

  sql += '-- cards\n';
  // Removed: const cardSpecialsToGenerate: CardSpecial[] = []; // This is now directly from state.cardSpecials
  const cardActiveSkillsToGenerate: CardActiveSkill[] = [];
  const cardCategoriesToGenerate: CardCategoryEntry[] = [];

  state.cardForms.forEach(form => {
    sql += generateInsertOrReplace('cards', form);

    (form.category_ids || []).forEach((catId, index) => {
      if (catId && catId.trim() !== '') {
        // Determine the correct card_id for category based on form.id
        cardCategoriesToGenerate.push({
          id: `${form.id}_cat_${catId}_${index}`, // Ensure unique ID for the junction table row
          card_id: form.id,
          card_category_id: catId,
          num: index, // Store order if needed, though `num` in DB seems to be category order on screen
        });
      }
    });
    
    if (form.active_skill_set_id_ref) {
        cardActiveSkillsToGenerate.push({
            id: `${form.id}_${form.active_skill_set_id_ref}`, // Composite ID for card_active_skills table row
            card_id: form.id,
            active_skill_set_id: form.active_skill_set_id_ref,
        });
    }
  });
  sql += '\n';

  if (cardCategoriesToGenerate.length > 0) {
    sql += '-- card_card_categories\n';
    cardCategoriesToGenerate.forEach(catEntry => {
      sql += generateInsertOrReplace('card_card_categories', catEntry);
    });
    sql += '\n';
  }

  sql += '-- leader_skill_sets\n';
  state.leaderSkillSets.forEach(set => {
    sql += generateInsertOrReplace('leader_skill_sets', { id: set.id, name: set.name, description: set.description });
    sql += '-- leader_skills for set ' + set.id + '\n';
    set.skills.forEach(skill => {
      // Ensure leader_skill_set_id is correctly passed if not directly on skill object
      const skillData = { ...skill, leader_skill_set_id: set.id };
      sql += generateInsertOrReplace('leader_skills', skillData);
    });
  });
  sql += '\n';

  sql += '-- passive_skill_sets\n';
  const passiveSkillSetRelationsToGenerate: { id: DokkanID, passive_skill_set_id: DokkanID, passive_skill_id: DokkanID }[] = [];
  state.passiveSkillSets.forEach(set => {
    sql += generateInsertOrReplace('passive_skill_sets', { id: set.id, name: set.name, description: set.description, itemized_description: set.itemized_description });
    sql += '-- passive_skills for set ' + set.id + '\n';
    set.skills.forEach(skill => {
      sql += generateInsertOrReplace('passive_skills', skill);
      passiveSkillSetRelationsToGenerate.push({
        id: `${set.id}_${skill.id}`, // Composite ID for relation
        passive_skill_set_id: set.id,
        passive_skill_id: skill.id,
      });
    });
  });
  sql += '\n';

  if (passiveSkillSetRelationsToGenerate.length > 0) {
    sql += '-- passive_skill_set_relations\n';
    passiveSkillSetRelationsToGenerate.forEach(relation => {
      sql += generateInsertOrReplace('passive_skill_set_relations', relation);
    });
    sql += '\n';
  }
  
  sql += '-- special_sets\n';
  state.specialSets.forEach(set => {
    sql += generateInsertOrReplace('special_sets', { 
        id: set.id, name: set.name, description: set.description, 
        causality_description: set.causality_description, aim_target: set.aim_target,
        increase_rate: set.increase_rate, lv_bonus: set.lv_bonus, is_inactive: set.is_inactive
    });
    sql += '-- specials for set ' + set.id + '\n';
    set.skills.forEach(skill => {
      // Ensure special_set_id is correctly passed
      const skillData = { ...skill, special_set_id: set.id };
      sql += generateInsertOrReplace('specials', skillData);
    });
  });
  sql += '\n';

  if (state.cardSpecials && state.cardSpecials.length > 0) {
    sql += '-- card_specials (links cards to special_sets)\n';
    state.cardSpecials.forEach(cs => {
        // Example: INSERT OR REPLACE INTO "main"."card_specials" ("id", "card_id", "special_set_id", "priority", "style", "lv_start", "eball_num_start", "view_id", "card_costume_condition_id", "special_bonus_id1", "special_bonus_lv1", "bonus_view_id1", "special_bonus_id2", "special_bonus_lv2", "bonus_view_id2", "causality_conditions", "special_asset_id", "created_at", "updated_at") VALUES ('1062320', '1062320', '1062321', 0, 'Normal', 0, 12, 15377, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0);
        sql += generateInsertOrReplace('card_specials', cs);
    });
    sql += '\n';
  }


  sql += '-- active_skill_sets\n';
  state.activeSkillSets.forEach(set => {
    sql += generateInsertOrReplace('active_skill_sets', { 
        id: set.id, name: set.name, effect_description: set.effect_description, 
        condition_description: set.condition_description, turn: set.turn, exec_limit: set.exec_limit,
        causality_conditions: set.causality_conditions, ultimate_special_id: set.ultimate_special_id,
        special_view_id: set.special_view_id, costume_special_view_id: set.costume_special_view_id,
        bgm_id: set.bgm_id 
    });
    sql += '-- active_skills for set ' + set.id + '\n';
    set.skills.forEach(skill => {
      // Ensure active_skill_set_id is correctly passed
      const skillData = { ...skill, active_skill_set_id: set.id };
      sql += generateInsertOrReplace('active_skills', skillData);
    });
  });
  sql += '\n';

  if (cardActiveSkillsToGenerate.length > 0) {
    sql += '-- card_active_skills (links cards to active_skill_sets)\n';
    cardActiveSkillsToGenerate.forEach(cas => {
        sql += generateInsertOrReplace('card_active_skills', cas);
    });
    sql += '\n';
  }
  
  // Misc Tables
  if (state.passiveSkillEffects && state.passiveSkillEffects.length > 0) {
    sql += '-- passive_skill_effects\n';
    state.passiveSkillEffects.forEach(pse => {
      sql += generateInsertOrReplace('passive_skill_effects', pse);
    });
    sql += '\n';
  }

  if (state.effectPacks && state.effectPacks.length > 0) {
    sql += '-- effect_packs\n';
    state.effectPacks.forEach(ep => {
      sql += generateInsertOrReplace('effect_packs', ep);
    });
    sql += '\n';
  }

  // EZA related updates
  if (state.isEZA && state.optimalAwakeningGrowth && state.baseCardIdForEZA) {
    sql += '-- EZA Update\n';
    const oag = state.optimalAwakeningGrowth;
    // Insert the new optimal_awakening_growths entry
    sql += generateInsertOrReplace('optimal_awakening_growths', oag);
    
    // Update the base card
    sql += `UPDATE "main"."cards" SET 
        "optimal_awakening_grow_type" = ${formatValue(oag.growth_type_id)},
        "lv_max" = ${formatValue(oag.val2_max_level)},
        "skill_lv_max" = ${formatValue(oag.val3_skill_lv_max)},
        "passive_skill_set_id" = ${formatValue(oag.passive_skill_set_id)},
        "leader_skill_set_id" = ${formatValue(oag.leader_skill_set_id)},
        "updated_at" = ${formatValue(getCurrentSqlTimestamp())} -- Use current timestamp
    WHERE "id" = ${formatValue(state.baseCardIdForEZA)};\n\n`;

    // Optionally, update the EZA'd form if it's one of the cardForms in the patch
    // This depends on how EZA forms are handled (new ID or same ID as baseCardIdForEZA)
    // For now, we assume the card ID being EZA'd is `baseCardIdForEZA`.
    // If the patch includes a CardForm with ID `baseCardIdForEZA`, its stats might need EZA values.
    // The current structure focuses on inserting new/updated forms via cardForms array.
    // The UPDATE above handles the primary EZA data linking.
  }


  sql += '-- End of Patch --\n';
  return sql;
};
