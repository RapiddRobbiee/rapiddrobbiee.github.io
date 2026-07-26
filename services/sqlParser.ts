import {
    DokkanPatchState,
    CardForm,
    CardUniqueInfo,
    PassiveSkillSet,
    LeaderSkillSet,
    SpecialSet,
    ActiveSkillSet,
    StandbySkillSet,
    FinishSkillSet,
    CardSpecial,
    CardActiveSkill,
    CardStandbySkill,
    PassiveSkillEffectEntry,
    EffectPackEntry,
    DokkanID,
    PassiveSkill,
    LeaderSkill,
    Special,
    ActiveSkillEffect,
    StandbySkill,
    FinishSkill,
    StandbySkillSetFinishSkillSetRelation,
    FinishSpecial,
    BattleParam,
    SkillCausality,
    CardCategoryEntry,
    OptimalAwakeningGrowth,
    SubTargetTypeSet,
    SubTargetType,
    CardAwakeningRoute,
    Character,
    UltimateSpecial,
    SpecialView,
} from '../types';
import { getInitialPatchState } from '../hooks/usePatchState';

// Helper to parse SQL values
const parseSqlValue = (value: string): any => {
    value = value.trim();
    if (value.toUpperCase() === 'NULL') return null;
    if (value.startsWith("'") && value.endsWith("'")) {
        // Remove surrounding quotes and unescape single quotes
        return value.slice(1, -1).replace(/''/g, "'");
    }
    if (!isNaN(Number(value))) {
        return Number(value);
    }
    return value;
};

// Helper to parse an INSERT statement
const parseInsertStatement = (
    sql: string
): { tableName: string; columns: string[]; values: any[] } | null => {
    // Regex to match INSERT INTO "main"."tableName" (col1, col2) VALUES (val1, val2);
    // Also handles INSERT OR REPLACE
    // Modified to handle optional quotes around main and table name, and optional main prefix
    // The VALUES part ([^;]+) matches everything until the semicolon, including newlines
    const regex =
        /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+(?:(?:"?main"?)\.)?"?(\w+)"?\s*\(([^)]+)\)\s*VALUES\s*\(([^;]+)\);/i;
    const match = sql.match(regex);

    if (!match) return null;

    const tableName = match[1].toLowerCase();
    const columns = match[2].split(',').map((c) => c.trim().replace(/"/g, ''));

    // Parsing values is tricky because of commas inside strings.
    // We'll use a simple state machine or regex to split by comma outside of quotes.
    const valuesStr = match[3];
    const values: any[] = [];
    let currentVal = '';
    let inQuote = false;

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        if (char === "'" && (i === 0 || valuesStr[i - 1] !== '\\')) {
            // Handle escaped quotes: '' is an escaped quote in SQL
            if (inQuote && i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
                currentVal += "''";
                i++; // Skip next quote
            } else {
                inQuote = !inQuote;
                currentVal += char;
            }
        } else if (char === ',' && !inQuote) {
            values.push(parseSqlValue(currentVal));
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    if (currentVal.trim() !== '') {
        values.push(parseSqlValue(currentVal));
    }

    return { tableName, columns, values };
};

export const parseSqlPatch = (sql: string): DokkanPatchState => {
    const state: DokkanPatchState = { ...getInitialPatchState() };

    // Reset arrays that might have initial data in getInitialPatchState
    state.cardForms = [];
    state.cardUniqueInfos = [];
    state.passiveSkillSets = [];
    state.leaderSkillSets = [];
    state.specialSets = [];
    state.activeSkillSets = [];
    state.cardSpecials = [];
    state.cardActiveSkills = [];
    state.cardStandbySkills = [];
    state.passiveSkillEffects = [];
    state.effectPacks = [];
    state.standbySkillSets = [];
    state.finishSkillSets = [];
    state.standbySkillSetFinishSkillSetRelations = [];
    state.finishSpecials = [];
    state.battleParams = [];
    state.skillCausalities = [];
    state.subTargetTypeSets = [];
    state.subTargetTypes = [];
    state.cardAwakeningRoutes = [];

    // Temporary storage for skills before they are assigned to sets
    const tempPassiveSkills: PassiveSkill[] = [];
    const tempLeaderSkills: LeaderSkill[] = [];
    const tempSpecials: Special[] = [];
    const tempActiveSkills: ActiveSkillEffect[] = [];
    const tempStandbySkills: StandbySkill[] = [];
    const tempFinishSkills: FinishSkill[] = [];

    // Relations storage
    const passiveSkillSetRelations: { id: DokkanID; passive_skill_set_id: DokkanID; passive_skill_id: DokkanID }[] = [];
    const cardCategories: CardCategoryEntry[] = [];

    const lines = sql.split('\n');
    console.log(`[SQL Parser] Processing ${lines.length} lines of SQL...`);

    const foundTables = new Set<string>();

    // Map singular table names to plural if needed
    const TABLE_MAP: Record<string, string> = {
        'card': 'cards',
        'passive_skill_set': 'passive_skill_sets',
        'passive_skill': 'passive_skills',
        'leader_skill_set': 'leader_skill_sets',
        'leader_skill': 'leader_skills',
        'special_set': 'special_sets',
        'special': 'specials',
        'active_skill_set': 'active_skill_sets',
        'active_skill': 'active_skills',
        'standby_skill_set': 'standby_skill_sets',
        'standby_skill': 'standby_skills',
        'finish_skill_set': 'finish_skill_sets',
        'finish_skill': 'finish_skills',
        'card_special': 'card_specials',
        'card_active_skill': 'card_active_skills',
        'card_standby_skill': 'card_standby_skills',
        'passive_skill_effect': 'passive_skill_effects',
        'effect_pack': 'effect_packs',
        'battle_param': 'battle_params',
        'skill_causality': 'skill_causalities',
        'card_unique_info': 'card_unique_infos',
        'optimal_awakening_growth': 'optimal_awakening_growths',
        'card_card_category': 'card_card_categories',
        'passive_skill_set_relation': 'passive_skill_set_relations',
        'card_standby_skill_set_relation': 'card_standby_skill_set_relations',
        'standby_skill_set_finish_skill_set_relation': 'standby_skill_set_finish_skill_set_relations',
        'sub_target_type_set': 'sub_target_type_sets',
        'sub_target_type': 'sub_target_types',
        'card_awakening_route': 'card_awakening_routes',
        'character': 'characters',
        'ultimate_special': 'ultimate_specials',
        'special_view': 'special_views',
    };

    let statementBuffer = '';

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('--')) continue;

        statementBuffer += line + '\n';

        // Check if statement is complete (ends with semicolon)
        // Note: This is a simple check and might fail if semicolon is inside a string at the end of line
        // But for this specific SQL format it should be sufficient.
        if (trimmedLine.endsWith(';')) {
            const parsed = parseInsertStatement(statementBuffer);
            statementBuffer = ''; // Reset buffer

            if (!parsed) {
                // Only warn if it looks like an INSERT but failed
                if (trimmedLine.toUpperCase().startsWith('INSERT')) {
                    console.warn('[SQL Parser] Failed to parse statement:', trimmedLine.substring(0, 50) + '...');
                }
                continue;
            }

            let { tableName, columns, values } = parsed;

            // Normalize table name
            if (TABLE_MAP[tableName]) {
                tableName = TABLE_MAP[tableName];
            }
            foundTables.add(tableName);

            const row: any = {};
            columns.forEach((col, index) => {
                let val = values[index];
                // Force ID columns to be strings
                if ((col === 'id' || col.endsWith('_id')) && val !== null && typeof val === 'number') {
                    val = String(val);
                }
                row[col] = val;
            });

            switch (tableName) {
                case 'cards':
                    state.cardForms.push(row as CardForm);
                    break;
                case 'card_unique_infos':
                    state.cardUniqueInfos.push(row as CardUniqueInfo);
                    break;
                case 'optimal_awakening_growths':
                    state.optimalAwakeningGrowth = row as OptimalAwakeningGrowth;
                    state.isEZA = true;
                    break;
                case 'card_card_categories':
                    cardCategories.push(row as CardCategoryEntry);
                    break;
                case 'leader_skill_sets':
                    state.leaderSkillSets.push({ ...row, skills: [] } as LeaderSkillSet);
                    break;
                case 'leader_skills':
                    tempLeaderSkills.push(row as LeaderSkill);
                    break;
                case 'passive_skill_sets':
                    state.passiveSkillSets.push({ ...row, skills: [] } as PassiveSkillSet);
                    break;
                case 'passive_skills':
                    tempPassiveSkills.push(row as PassiveSkill);
                    break;
                case 'passive_skill_set_relations':
                    passiveSkillSetRelations.push(row);
                    break;
                case 'special_sets':
                    state.specialSets.push({ ...row, skills: [] } as SpecialSet);
                    break;
                case 'specials':
                    tempSpecials.push(row as Special);
                    break;
                case 'card_specials':
                    state.cardSpecials.push(row as CardSpecial);
                    break;
                case 'passive_skill_effects':
                    state.passiveSkillEffects.push(row as PassiveSkillEffectEntry);
                    break;
                case 'effect_packs':
                    state.effectPacks.push(row as EffectPackEntry);
                    break;
                case 'active_skill_sets':
                    state.activeSkillSets.push({ ...row, skills: [] } as ActiveSkillSet);
                    break;
                case 'active_skills':
                    tempActiveSkills.push(row as ActiveSkillEffect);
                    break;
                case 'card_active_skills':
                    state.cardActiveSkills.push(row as CardActiveSkill);
                    break;
                case 'standby_skill_sets':
                    state.standbySkillSets.push({ ...row, skills: [] } as StandbySkillSet);
                    break;
                case 'standby_skills':
                    tempStandbySkills.push(row as StandbySkill);
                    break;
                case 'card_standby_skill_set_relations':
                    state.cardStandbySkills.push(row as CardStandbySkill);
                    break;
                case 'finish_specials':
                    state.finishSpecials.push(row as FinishSpecial);
                    break;
                case 'finish_skill_sets':
                    state.finishSkillSets.push({ ...row, skills: [] } as FinishSkillSet);
                    break;
                case 'finish_skills':
                    tempFinishSkills.push(row as FinishSkill);
                    break;
                case 'standby_skill_set_finish_skill_set_relations':
                    state.standbySkillSetFinishSkillSetRelations.push(row as StandbySkillSetFinishSkillSetRelation);
                    break;
                case 'battle_params':
                    state.battleParams.push(row as BattleParam);
                    break;
                case 'skill_causalities':
                    state.skillCausalities.push(row as SkillCausality);
                    break;
                case 'sub_target_type_sets':
                    state.subTargetTypeSets.push(row as SubTargetTypeSet);
                    break;
                case 'sub_target_types':
                    state.subTargetTypes.push(row as SubTargetType);
                    break;
                case 'card_awakening_routes':
                    state.cardAwakeningRoutes.push(row as CardAwakeningRoute);
                    break;
                case 'characters':
                    state.characters.push(row as Character);
                    break;
                case 'ultimate_specials':
                    state.ultimateSpecials.push(row as UltimateSpecial);
                    break;
                case 'special_views':
                    state.specialViews.push(row as SpecialView);
                    break;
            }
        }
    }

    console.log('[SQL Parser] Parsing complete. Counts:', {
        cards: state.cardForms.length,
        passiveSets: state.passiveSkillSets.length,
        passiveSkills: tempPassiveSkills.length,
        passiveRelations: passiveSkillSetRelations.length,
        leaderSets: state.leaderSkillSets.length,
        leaderSkills: tempLeaderSkills.length,
        specialSets: state.specialSets.length,
        specials: tempSpecials.length,
        activeSets: state.activeSkillSets.length,
        activeSkills: tempActiveSkills.length
    });
    console.log('[SQL Parser] Found tables:', Array.from(foundTables));

    // Post-processing to link skills to sets

    // Link Passive Skills
    state.passiveSkillSets.forEach(set => {
        const relations = passiveSkillSetRelations.filter(r => r.passive_skill_set_id === set.id);
        relations.sort((a, b) => a.id.localeCompare(b.id));

        set.skills = relations.map(r => tempPassiveSkills.find(s => s.id === r.passive_skill_id)).filter(s => s !== undefined) as PassiveSkill[];
    });

    // Link Leader Skills
    state.leaderSkillSets.forEach(set => {
        set.skills = tempLeaderSkills.filter(s => s.leader_skill_set_id === set.id);
    });

    // Link Special Skills
    state.specialSets.forEach(set => {
        set.skills = tempSpecials.filter(s => s.special_set_id === set.id);
    });

    // Link Active Skills to Sets
    state.activeSkillSets.forEach(set => {
        set.skills = tempActiveSkills.filter(s => s.active_skill_set_id === set.id);
    });

    // Link Standby Skills to Sets
    state.standbySkillSets.forEach(set => {
        set.skills = tempStandbySkills.filter(s => s.standby_skill_set_id === set.id);
    });

    // Link Finish Skills to Sets
    state.finishSkillSets.forEach(set => {
        set.skills = tempFinishSkills.filter(s => s.finish_skill_set_id === set.id);
    });

    // Link Active Skill junction entries back to card forms
    for (const cas of state.cardActiveSkills) {
        const cardForm = state.cardForms.find(cf => cf.id === cas.card_id);
        if (cardForm) {
            cardForm.active_skill_set_id_ref = cas.active_skill_set_id;
        }
    }

    // Link Standby Skill junction entries back to card forms
    for (const css of state.cardStandbySkills) {
        const cardForm = state.cardForms.find(cf => cf.id === css.card_id);
        if (cardForm) {
            cardForm.standby_skill_set_id_ref = css.standby_skill_set_id;
        }
    }

    // Helper to check if row has key (since we cast to any)
    function rowHasKey(obj: any, key: string): boolean {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    // Link Categories to Cards
    state.cardForms.forEach(card => {
        const cardCats = cardCategories.filter(c => c.card_id === card.id);
        cardCats.sort((a, b) => a.num - b.num);
        card.category_ids = cardCats.map(c => c.card_category_id);

        // Also ensure link_skill_ids is initialized if it was null in SQL
        if (!card.link_skill_ids) {
            const linkIds: string[] = [];
            for (let i = 1; i <= 7; i++) {
                const key = `link_skill_id_${i}`;
                if (rowHasKey(card, key)) {
                    let val = (card as any)[key];
                    if (val !== null && val !== undefined) {
                        if (typeof val === 'number') val = String(val);
                        linkIds.push(val);
                    }
                }
            }
            card.link_skill_ids = linkIds;
        }
    });

    // Re-process cards to ensure link_skill_ids are populated from flat columns
    state.cardForms = state.cardForms.map(card => {
        const linkIds: string[] = [];
        for (let i = 1; i <= 7; i++) {
            const key = `link_skill_id_${i}`;
            if ((card as any)[key]) {
                let val = (card as any)[key];
                if (typeof val === 'number') val = String(val);
                linkIds.push(val);
            }
        }
        // Only override if we found flat columns, otherwise keep existing (which might be empty array from init)
        if (linkIds.length > 0) {
            return {
                ...card,
                link_skill_ids: linkIds
            };
        }
        return card;
    });

    return state;
};
