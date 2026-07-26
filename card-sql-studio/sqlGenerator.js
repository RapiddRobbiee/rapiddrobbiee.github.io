import { DOKKAN_TABLE_COLUMNS } from "./dokkanModel.js";

function getCurrentSqlTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  const microseconds = `${milliseconds}000`.slice(0, 6);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${microseconds}`;
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return String(value);
}

function getDefaultValue(tableName, columnName, data) {
  if (
    Object.prototype.hasOwnProperty.call(data, columnName) &&
    data[columnName] !== undefined &&
    data[columnName] !== null
  ) {
    if (
      tableName === "cards" &&
      columnName.startsWith("link_skill") &&
      columnName.endsWith("_id") &&
      data[columnName] === ""
    ) {
      return null;
    }
    if (data[columnName] === "") {
      const treatEmptyStringAsNullColumns = [
        "sub_target_type_set_id",
        "passive_skill_effect_id",
        "ultimate_special_id",
        "special_view_id",
        "bgm_id",
        "thumb_effect_id",
        "effect_se_id",
        "aura_id",
        "optimal_awakening_grow_type",
        "potential_board_id",
        "special_asset_id",
        "kana",
      ];
      if (treatEmptyStringAsNullColumns.includes(columnName)) {
        return null;
      }
    }
    return data[columnName];
  }

  if (columnName === "created_at" || columnName === "updated_at") {
    if (tableName === "card_active_skills") {
      return 0;
    }
    return getCurrentSqlTimestamp();
  }
  if (tableName === "cards" && columnName === "open_at") {
    return 0;
  }

  if (tableName === "cards") {
    if (columnName.startsWith("link_skill") && columnName.endsWith("_id")) {
      const linkSkillIds = Array.isArray(data.link_skill_ids) ? data.link_skill_ids : [];
      const index = Number.parseInt(columnName.replace("link_skill", "").replace("_id", ""), 10) - 1;
      if (index >= 0 && index < linkSkillIds.length && linkSkillIds[index] && linkSkillIds[index] !== "") {
        return linkSkillIds[index];
      }
      return null;
    }

    if (
      [
        "optimal_awakening_grow_type",
        "aura_id",
        "aura_scale",
        "aura_offset_x",
        "aura_offset_y",
        "awakening_number",
        "resource_id",
        "bg_effect_id",
        "awakening_element_type",
        "potential_board_id",
      ].includes(columnName)
    ) {
      return null;
    }

    if (columnName === "is_aura_front") {
      return 0;
    }
  }

  if (tableName === "card_unique_infos" && columnName === "kana") {
    return null;
  }
  if (tableName === "leader_skill_sets" && columnName === "description") {
    return null;
  }
  if (tableName === "special_sets") {
    if (columnName === "description" || columnName === "causality_description") {
      return null;
    }
  }
  if (tableName === "passive_skill_sets" && columnName === "itemized_description") {
    return null;
  }
  if (tableName === "active_skill_sets") {
    if (columnName === "costume_special_view_id") {
      return 0;
    }
    if (
      ["causality_conditions", "ultimate_special_id", "special_view_id", "bgm_id"].includes(columnName)
    ) {
      return null;
    }
  }
  if (tableName === "standby_skill_sets") {
    if (columnName === "costume_special_view_id") {
      return 0;
    }
    if (["causality_conditions", "special_view_id", "bgm_id"].includes(columnName)) {
      return null;
    }
  }
  if (tableName === "active_skills") {
    if (columnName === "efficacy_values") {
      return "{}";
    }
    if (["sub_target_type_set_id", "thumb_effect_id", "effect_se_id"].includes(columnName)) {
      return null;
    }
    if (["eff_val1", "eff_val2", "eff_val3"].includes(columnName)) {
      return 0;
    }
  }
  if (tableName === "card_specials") {
    if (["causality_conditions", "special_asset_id"].includes(columnName)) {
      return null;
    }
  }

  return undefined;
}

function generateInsertOrReplace(tableName, data) {
  const definedColumns = DOKKAN_TABLE_COLUMNS[tableName];
  if (!definedColumns) {
    return `-- WARN: No table definition for ${tableName}\n`;
  }
  const columnNames = definedColumns.map((column) => `"${column}"`).join(", ");
  const values = definedColumns
    .map((column) => formatValue(getDefaultValue(tableName, column, data)))
    .join(", ");
  return `INSERT OR REPLACE INTO "main"."${tableName}" (${columnNames}) VALUES (${values});\n`;
}

export function generateSqlPatch(state) {
  let sql = "-- Dokkan Battle Patch Generated (Legacy-Aware Standalone) --\n\n";

  sql += "-- cards\n";
  const categoryRows = [];
  state.cardForms.forEach((form) => {
    sql += generateInsertOrReplace("cards", form);
    (form.category_ids || []).forEach((categoryId, index) => {
      if (!categoryId || !String(categoryId).trim()) {
        return;
      }
      categoryRows.push({
        id: `${form.id}${String(index + 1).padStart(3, "0")}`,
        card_id: form.id,
        card_category_id: String(categoryId).trim(),
        num: index + 1,
      });
    });
  });
  sql += "\n";

  if (state.characters.length) {
    sql += "-- characters\n";
    state.characters.forEach((row) => {
      sql += generateInsertOrReplace("characters", row);
    });
    sql += "\n";
  }

  if (state.cardUniqueInfos.length) {
    sql += "-- card_unique_infos\n";
    state.cardUniqueInfos.forEach((row) => {
      sql += generateInsertOrReplace("card_unique_infos", row);
    });
    sql += "\n";
  }

  if (categoryRows.length) {
    sql += "-- card_card_categories\n";
    categoryRows.forEach((row) => {
      sql += generateInsertOrReplace("card_card_categories", row);
    });
    sql += "\n";
  }

  if (state.passiveSkillSets.length) {
    sql += "-- passive_skill_sets\n";
    state.passiveSkillSets.forEach((row) => {
      sql += generateInsertOrReplace("passive_skill_sets", row);
    });
    sql += "\n";
  }

  if (state.leaderSkillSets.length) {
    sql += "-- leader_skill_sets\n";
    state.leaderSkillSets.forEach((row) => {
      sql += generateInsertOrReplace("leader_skill_sets", row);
    });
    sql += "\n";
  }

  if (state.specialSets.length) {
    sql += "-- special_sets\n";
    state.specialSets.forEach((row) => {
      sql += generateInsertOrReplace("special_sets", row);
    });
    sql += "\n";
  }

  if (state.cardSpecials.length) {
    sql += "-- card_specials\n";
    state.cardSpecials.forEach((row) => {
      sql += generateInsertOrReplace("card_specials", row);
    });
    sql += "\n";
  }

  if (state.activeSkillSets.length) {
    sql += "-- active_skill_sets\n";
    state.activeSkillSets.forEach((setRow) => {
      sql += generateInsertOrReplace("active_skill_sets", setRow);
      (setRow.skills || []).forEach((skillRow) => {
        sql += generateInsertOrReplace("active_skills", {
          ...skillRow,
          active_skill_set_id: setRow.id,
        });
      });
    });
    sql += "\n";
  }

  if (state.cardActiveSkills.length) {
    sql += "-- card_active_skills\n";
    state.cardActiveSkills.forEach((row) => {
      let idForRow = row.active_skill_set_id;
      if (String(row.card_id).endsWith("1")) {
        idForRow = `${row.active_skill_set_id}1`;
      }
      sql += generateInsertOrReplace("card_active_skills", {
        id: idForRow,
        card_id: row.card_id,
        active_skill_set_id: row.active_skill_set_id,
      });
    });
    sql += "\n";
  }

  if (state.standbySkillSets.length) {
    sql += "-- standby_skill_sets\n";
    state.standbySkillSets.forEach((row) => {
      sql += generateInsertOrReplace("standby_skill_sets", row);
    });
    sql += "\n";
  }

  if (state.cardStandbySkills.length) {
    sql += "-- card_standby_skill_set_relations\n";
    state.cardStandbySkills.forEach((row) => {
      sql += generateInsertOrReplace("card_standby_skill_set_relations", row);
    });
    sql += "\n";
  }

  sql += "-- End of Patch --\n";
  return sql;
}
