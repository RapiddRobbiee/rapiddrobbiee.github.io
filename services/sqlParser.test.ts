import { describe, it, expect } from 'vitest';
import { parseSqlPatch } from './sqlParser';

describe('sqlParser', () => {
    it('should parse a simple card insert', () => {
        const sql = `INSERT INTO "main"."cards" ("id", "name", "cost") VALUES ('123456', 'Test Card', 99);`;
        const state = parseSqlPatch(sql);
        expect(state.cardForms).toHaveLength(1);
        expect(state.cardForms[0].id).toBe('123456');
        expect(state.cardForms[0].name).toBe('Test Card');
        expect(state.cardForms[0].cost).toBe(99);
    });

    it('should parse passive skill sets and link skills', () => {
        const sql = `
      INSERT INTO "main"."passive_skill_sets" ("id", "name") VALUES ('777', 'Test Passive Set');
      INSERT INTO "main"."passive_skills" ("id", "name", "eff_value1") VALUES ('888', 'Test Skill', 150);
      INSERT INTO "main"."passive_skill_set_relations" ("id", "passive_skill_set_id", "passive_skill_id") VALUES ('REL1', '777', '888');
    `;
        const state = parseSqlPatch(sql);
        expect(state.passiveSkillSets).toHaveLength(1);
        expect(state.passiveSkillSets[0].id).toBe('777');
        expect(state.passiveSkillSets[0].skills).toHaveLength(1);
        expect(state.passiveSkillSets[0].skills[0].id).toBe('888');
        expect(state.passiveSkillSets[0].skills[0].eff_value1).toBe(150);
    });

    it('should handle escaped quotes in values', () => {
        const sql = `INSERT INTO "main"."cards" ("id", "name") VALUES ('1', 'Goku''s Fury');`;
        const state = parseSqlPatch(sql);
        expect(state.cardForms[0].name).toBe("Goku's Fury");
    });

    it('should handle NULL values', () => {
        const sql = `INSERT INTO "main"."cards" ("id", "name", "aura_id") VALUES ('1', 'Test', NULL);`;
        const state = parseSqlPatch(sql);
        expect(state.cardForms[0].aura_id).toBeNull();
    });

    it('should handle numeric IDs and link correctly', () => {
        // This simulates SQL where IDs are not quoted (integers)
        const sql = `
      INSERT INTO "main"."passive_skill_sets" ("id", "name") VALUES (777, 'Numeric ID Set');
      INSERT INTO "main"."passive_skills" ("id", "name") VALUES (888, 'Numeric ID Skill');
      INSERT INTO "main"."passive_skill_set_relations" ("id", "passive_skill_set_id", "passive_skill_id") VALUES (999, 777, 888);
    `;
        const state = parseSqlPatch(sql);
        expect(state.passiveSkillSets).toHaveLength(1);
        // Expect the ID to be converted to string in the state
        expect(state.passiveSkillSets[0].id).toBe('777');
        expect(state.passiveSkillSets[0].skills).toHaveLength(1);
        expect(state.passiveSkillSets[0].skills[0].id).toBe('888');
    });

    it('should handle mixed case table names', () => {
        const sql = `INSERT INTO "main"."Cards" ("id", "name") VALUES ('999', 'Case Test');`;
        const state = parseSqlPatch(sql);
        expect(state.cardForms).toHaveLength(1);
        expect(state.cardForms[0].id).toBe('999');
    });

    it('should handle unquoted main prefix', () => {
        const sql = `INSERT INTO main.cards ("id", "name") VALUES ('888', 'Prefix Test');`;
        const state = parseSqlPatch(sql);
        expect(state.cardForms).toHaveLength(1);
        expect(state.cardForms[0].id).toBe('888');
    });

    it('should handle singular table names', () => {
        const sql = `INSERT INTO "main"."passive_skill_set" ("id", "name") VALUES ('555', 'Singular Set');`;
        const state = parseSqlPatch(sql);
        expect(state.passiveSkillSets).toHaveLength(1);
        expect(state.passiveSkillSets[0].id).toBe('555');
    });

    it('should handle multiline INSERT statements', () => {
        const sql = `INSERT INTO "main"."passive_skill_sets" ("id", "name", "itemized_description") VALUES (
            '999', 
            'Multiline Test', 
            'Line 1
            Line 2'
        );`;
        const state = parseSqlPatch(sql);
        expect(state.passiveSkillSets).toHaveLength(1);
        expect(state.passiveSkillSets[0].id).toBe('999');
        expect(state.passiveSkillSets[0].itemized_description).toContain('Line 1');
    });
    it('should parse sub_target_type_sets and sub_target_types', () => {
        const sql = `
            INSERT INTO "main"."sub_target_type_sets" ("id") VALUES ('135');
            INSERT INTO "main"."sub_target_types" ("id", "sub_target_type_set_id", "target_value_type", "target_value") VALUES ('158', '135', 1, 55);
        `;
        const state = parseSqlPatch(sql);
        expect(state.subTargetTypeSets).toHaveLength(1);
        expect(state.subTargetTypeSets[0].id).toBe('135');
        expect(state.subTargetTypes).toHaveLength(1);
        expect(state.subTargetTypes[0].id).toBe('158');
        expect(state.subTargetTypes[0].sub_target_type_set_id).toBe('135');
        expect(state.subTargetTypes[0].target_value_type).toBe(1);
        expect(state.subTargetTypes[0].target_value).toBe(55);
    });
});
