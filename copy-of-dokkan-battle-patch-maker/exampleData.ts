
import { DokkanPatchState, CardForm, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, CardSpecial } from './types';
import { INITIAL_CARD_FORM } from './constants';

const ssbGokuUniquePassiveAndSpecialId = "1062321"; 
const ss4GokuUniquePassiveAndSpecialId = "1062322"; 
const sharedLeaderId = "106232";
const ssbGokuActiveId = "62321";
const ss4GokuActiveId = "62322";

const ssbGokuPassiveSkills: PassiveSkill[] = [
    { id: "1062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 131, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: "6232", calc_option: 0, turn: 4, is_once: 0, probability: 100, causality_conditions: '{"source":"5","compiled":5}', eff_value1: "4062321", eff_value2: 1, eff_value3: 0, efficacy_values: '{}' },
    { id: "1001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 3, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 200, eff_value2: 200, eff_value3: 0, efficacy_values: '{}' },
    { id: "2001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 5, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 3, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' },
    { id: "3001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 76, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "4001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 13, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 25, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' },
    { id: "5001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 3, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 4, is_once: 1, probability: 100, causality_conditions: null, eff_value1: 200, eff_value2: 200, eff_value3: 0, efficacy_values: '{}' },
    { id: "6001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 90, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 4, is_once: 1, probability: 100, causality_conditions: null, eff_value1: 70, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "7001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 4, is_once: 1, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 100, efficacy_values: '{}' }, 
    { id: "8001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 50, efficacy_values: '{}' }, 
    { id: "9001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 67, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 16, eff_value2: 1, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "10001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 2, target_type: 2, sub_target_type_set_id: "226", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 77, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "11001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 13, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 10, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "12001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 1, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 100, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' },
    { id: "13001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 13, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"25","compiled":25}', eff_value1: 15, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "14001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 78, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"25","compiled":25}', eff_value1: 0, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "15001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 1, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"2922|2923","compiled":["|",2922,2923]}', eff_value1: 77, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "16001062321", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"2922|2923","compiled":["|",2922,2923]}', eff_value1: 0, eff_value2: 0, eff_value3: 70, efficacy_values: '{}' }, 
];

const ss4GokuPassiveSkills: PassiveSkill[] = [
    { id: "1062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 131, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: "1062321", eff_value2: 1, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "1001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 3, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 200, eff_value2: 200, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "2001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 5, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 3, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "3001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 90, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 100, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "4001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 91, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 50, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "5001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 100, efficacy_values: '{}' }, 
    { id: "6001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 1, target_type: 2, sub_target_type_set_id: "226", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 77, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "7001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 100, efficacy_values: '{}' }, 
    { id: "8001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 11, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 50, efficacy_values: '{}' }, 
    { id: "9001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 1, efficacy_type: 67, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 16, eff_value2: 8, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "10001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 91, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 20, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' },
    { id: "11001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 1, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 200, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' },
    { id: "12001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 1, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"2922|2923","compiled":["|",2922,2923]}', eff_value1: 77, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "13001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 81, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 0, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"2922|2923","compiled":["|",2922,2923]}', eff_value1: 0, eff_value2: 0, eff_value3: 70, efficacy_values: '{}' }, 
    { id: "14001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 15, efficacy_type: 91, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"665","compiled":665}', eff_value1: 20, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "15001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 15, efficacy_type: 90, target_type: 16, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: '{"source":"665","compiled":665}', eff_value1: 25, eff_value2: 0, eff_value3: 0, efficacy_values: '{}' }, 
    { id: "16001062322", name: "The Possibilities of This Universe", description: "The Possibilities of This Universe", exec_timing_type: 4, efficacy_type: 98, target_type: 1, sub_target_type_set_id: "0", passive_skill_effect_id: null, calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null, eff_value1: 30, eff_value2: 120, eff_value3: 0, efficacy_values: '{}' }, 
];

const cardForms: CardForm[] = [
    { 
      ...INITIAL_CARD_FORM(), id: "1062320", name: "Super Saiyan God SS Goku + Super Full Power Saiyan 4 Goku", character_id: "1413", card_unique_info_id: ssbGokuUniquePassiveAndSpecialId,
      cost: 40, rarity: 4, hp_init: 5543, hp_max: 16688, atk_init: 4628, atk_max: 15275, def_init: 3087, def_max: 11132, element: 10, lv_max: 120, skill_lv_max: 10, grow_type: 41,
      price: 29466, exp_type: 15, training_exp: 6045, special_motion: 1,
      passive_skill_set_id: ssbGokuUniquePassiveAndSpecialId, leader_skill_set_id: sharedLeaderId,
      // Fix: Removed special_set_id_ref and special_view_id
      link_skill_ids: ["29", "47", "60", "70", "80", "97", "109"],
      category_ids: ["42", "39", "84", "61", "8", "17", "26", "30", "65", "79", "80", "87", "89"], 
      eball_mod_min: 50, eball_mod_num100: 4, eball_mod_mid: 0, eball_mod_mid_num: 0, eball_mod_max: 150, eball_mod_max_num: 12,
      max_level_reward_id: "1", max_level_reward_type: "1", collectable_type: 1,
      face_x: 336, face_y: 769, aura_id: "29", is_selling_only: 0,
      awakening_element_type: 1, potential_board_id: "23",
      active_skill_set_id_ref: ssbGokuActiveId,
    },
    { 
      ...INITIAL_CARD_FORM(), id: "1062321", name: "Super Saiyan God SS Goku + Super Full Power Saiyan 4 Goku", character_id: "1413", card_unique_info_id: ssbGokuUniquePassiveAndSpecialId,
      cost: 40, rarity: 4, hp_init: 5543, hp_max: 16688, atk_init: 4628, atk_max: 15275, def_init: 3087, def_max: 11132, element: 10, lv_max: 120, skill_lv_max: 10, grow_type: 41, 
      price: 29466, exp_type: 15, training_exp: 6045, special_motion: 1,
      passive_skill_set_id: ssbGokuUniquePassiveAndSpecialId, leader_skill_set_id: sharedLeaderId,
      // Fix: Removed special_set_id_ref and special_view_id
      link_skill_ids: ["29", "47", "60", "70", "80", "97", "109"],
      category_ids: ["42", "39", "84", "61", "8", "17", "26", "30", "65", "79", "80", "87", "89", "70", "60", "72"],
      eball_mod_min: 50, eball_mod_num100: 4, eball_mod_mid: 0, eball_mod_mid_num: 0, eball_mod_max: 150, eball_mod_max_num: 12,
      max_level_reward_id: "1", max_level_reward_type: "1", collectable_type: 1,
      face_x: 336, face_y: 769, aura_id: "29", is_selling_only: 0,
      awakening_element_type: 1, potential_board_id: "23",
      active_skill_set_id_ref: ssbGokuActiveId,
    },
     { 
      ...INITIAL_CARD_FORM(), id: "4062320", name: "Super Full Power Saiyan 4 Goku + Super Saiyan God SS Goku", character_id: "1286", card_unique_info_id: ss4GokuUniquePassiveAndSpecialId,
      cost: 40, rarity: 4, hp_init: 4106, hp_max: 13688, atk_init: 3935, atk_max: 13115, def_init: 2516, def_max: 8388, element: 13, lv_max: 120, skill_lv_max: 10, grow_type: 50,
      price: 50176, exp_type: 25, training_exp: 7980, special_motion: 1,
      passive_skill_set_id: ss4GokuUniquePassiveAndSpecialId, leader_skill_set_id: sharedLeaderId,
      // Fix: Removed special_set_id_ref and special_view_id
      link_skill_ids: ["29", "47", "60", "124", "95", "97", "109"],
      category_ids: ["42", "39", "84", "61", "8", "17", "26", "30", "65", "79", "80", "87", "89"],
      eball_mod_min: 50, eball_mod_num100: 4, eball_mod_mid: 0, eball_mod_mid_num: 0, eball_mod_max: 150, eball_mod_max_num: 12,
      max_level_reward_id: "1", max_level_reward_type: "1", collectable_type: 1,
      face_x: 336, face_y: 769, aura_id: null, is_selling_only: 0,
      awakening_element_type: null, potential_board_id: null, 
      active_skill_set_id_ref: ss4GokuActiveId,
    },
    { 
      ...INITIAL_CARD_FORM(), id: "4062321", name: "Super Full Power Saiyan 4 Goku + Super Saiyan God SS Goku", character_id: "1286", card_unique_info_id: ss4GokuUniquePassiveAndSpecialId,
      cost: 40, rarity: 4, hp_init: 5056, hp_max: 16688, atk_init: 4628, atk_max: 17543, def_init: 3087, def_max: 10188, element: 13, lv_max: 120, skill_lv_max: 10, grow_type: 50,
      price: 50176, exp_type: 25, training_exp: 7980, special_motion: 1,
      passive_skill_set_id: ss4GokuUniquePassiveAndSpecialId, leader_skill_set_id: sharedLeaderId,
      // Fix: Removed special_set_id_ref and special_view_id
      link_skill_ids: ["29", "47", "60", "124", "95", "97", "109"],
      category_ids: ["42", "39", "84", "61", "8", "17", "26", "30", "65", "79", "80", "87", "89", "70", "60", "72"],
      eball_mod_min: 50, eball_mod_num100: 4, eball_mod_mid: 0, eball_mod_mid_num: 0, eball_mod_max: 150, eball_mod_max_num: 12,
      max_level_reward_id: "1", max_level_reward_type: "1", collectable_type: 1,
      face_x: 336, face_y: 769, aura_id: null, is_selling_only: 0,
      awakening_element_type: 1, potential_board_id: "21", 
      active_skill_set_id_ref: ss4GokuActiveId,
    },
  ];

const leaderSkills: LeaderSkill[] = [ 
    {id: "10623200", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "100", causality_conditions: null, efficacy_type: 5, efficacy_values: '[3,0,0]', calc_option: 0 },
    {id: "10623201", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "100", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,200,0]', calc_option: 2 },
    {id: "10623202", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "633", causality_conditions: null, efficacy_type: 5, efficacy_values: '[3,0,0]', calc_option: 0 },
    {id: "10623203", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "633", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,200,0]', calc_option: 2 },
    {id: "10623204", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "634", causality_conditions: null, efficacy_type: 5, efficacy_values: '[3,0,0]', calc_option: 0 },
    {id: "10623205", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "634", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,200,0]', calc_option: 2 },
    {id: "10623206", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "316", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,20,0]', calc_option: 2 }, 
    {id: "10623207", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "635", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,20,0]', calc_option: 2 },
    {id: "10623208", leader_skill_set_id: sharedLeaderId, exec_timing_type: 1, target_type: 2, sub_target_type_set_id: "636", causality_conditions: null, efficacy_type: 82, efficacy_values: '[31,20,0]', calc_option: 2 },
];

const ssbGokuSpecialSkills: Special[] = [
    { id: "1062321", special_set_id: ssbGokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 2, target_type: 1, calc_option: 2, turn: 99, prob: 100, causality_conditions: null, eff_value1: 50, eff_value2: 0, eff_value3: 0 }, 
    { id: "1001062321", special_set_id: ssbGokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 1, target_type: 1, calc_option: 2, turn: 99, prob: 100, causality_conditions: null, eff_value1: 30, eff_value2: 0, eff_value3: 0 }, 
    { id: "2001062321", special_set_id: ssbGokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 111, target_type: 3, calc_option: 0, turn: 1, prob: 70, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 0 }, 
];

const ss4GokuSpecialSkills: Special[] = [
    { id: "1062322", special_set_id: ss4GokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 1, target_type: 1, calc_option: 2, turn: 99, prob: 100, causality_conditions: null, eff_value1: 50, eff_value2: 0, eff_value3: 0 }, 
    { id: "1001062322", special_set_id: ss4GokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 2, target_type: 1, calc_option: 2, turn: 99, prob: 100, causality_conditions: null, eff_value1: 30, eff_value2: 0, eff_value3: 0 }, 
    { id: "2001062322", special_set_id: ss4GokuUniquePassiveAndSpecialId, type: 'Special::NormalEfficacySpecial', efficacy_type: 9, target_type: 3, calc_option: 0, turn: 1, prob: 70, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 0 }, 
];

const ssbGokuActiveSkills: ActiveSkillEffect[] = [
    {id: "623211", active_skill_set_id: ssbGokuActiveId, target_type: 1, sub_target_type_set_id: null, calc_option: 2, efficacy_type: 1, eff_val1: 100, eff_val2: 0, eff_val3: 0, efficacy_values: '{}', thumb_effect_id: 5011, effect_se_id: 44}, 
    {id: "623212", active_skill_set_id: ssbGokuActiveId, target_type: 1, sub_target_type_set_id: null, calc_option: 0, efficacy_type: 90, eff_val1: 100, eff_val2: 0, eff_val3: 0, efficacy_values: '{}', thumb_effect_id: 5011, effect_se_id: 44}, 
    {id: "623213", active_skill_set_id: ssbGokuActiveId, target_type: 16, sub_target_type_set_id: null, calc_option: 2, efficacy_type: 2, eff_val1: 50, eff_val2: 0, eff_val3: 0, efficacy_values: '{}', thumb_effect_id: 5011, effect_se_id: 44}, 
];
const ss4GokuActiveSkills: ActiveSkillEffect[] = [
    {id: "623221", active_skill_set_id: ss4GokuActiveId, target_type: 1, sub_target_type_set_id: null, calc_option: 2, efficacy_type: 1, eff_val1: 100, eff_val2: 0, eff_val3: 0, efficacy_values: '{}', thumb_effect_id: 5011, effect_se_id: null}, 
    {id: "623222", active_skill_set_id: ss4GokuActiveId, target_type: 16, sub_target_type_set_id: null, calc_option: 2, efficacy_type: 1, eff_val1: 50, eff_val2: 0, eff_val3: 0, efficacy_values: '{}', thumb_effect_id: 5011, effect_se_id: null}, 
];


export const examplePatchState: DokkanPatchState = {
  cardForms: cardForms,
  cardUniqueInfos: [
    { id: ssbGokuUniquePassiveAndSpecialId, name: "Super Saiyan God SS Goku + Super Full Power Saiyan 4 Goku" },
    { id: ss4GokuUniquePassiveAndSpecialId, name: "Super Full Power Saiyan 4 Goku + Super Saiyan God SS Goku" },
  ],
  leaderSkillSets: [{
    id: sharedLeaderId, name: "Darkness-Purging Power", 
    description: `"Dragon Ball Heroes", "Kamehameha" or "Power Beyond Super Saiyan" Category Ki +3 and HP, ATK & DEF +200%, plus an additional HP, ATK & DEF +20% for characters who also belong to the "Crossover" Category`,
    skills: leaderSkills
  }],
  passiveSkillSets: [
    { id: ssbGokuUniquePassiveAndSpecialId, name: "The Possibilities of This Universe", description: "...", itemized_description: "...", skills: ssbGokuPassiveSkills },
    { id: ss4GokuUniquePassiveAndSpecialId, name: "The Possibilities of This Universe", description: "...", itemized_description: "...", skills: ss4GokuPassiveSkills },
  ],
  specialSets: [
    { id: ssbGokuUniquePassiveAndSpecialId, name: "Extreme Kamehameha", description: "...", causality_description: null, aim_target:0, increase_rate:180, lv_bonus:25, is_inactive:0, skills: ssbGokuSpecialSkills },
    { id: ss4GokuUniquePassiveAndSpecialId, name: "Dragon Strike Waltz", description: "...", causality_description: null, aim_target:0, increase_rate:180, lv_bonus:25, is_inactive:0, skills: ss4GokuSpecialSkills },
  ],
  activeSkillSets: [
    { id: ssbGokuActiveId, name: "Unyielding Fused Kamehameha", effect_description: "...", condition_description: "...", turn: 1, exec_limit: 1, causality_conditions: '{"source":"5","compiled":5}', ultimate_special_id: 77, special_view_id: 15507, costume_special_view_id: 0, bgm_id: 404, skills: ssbGokuActiveSkills },
    { id: ss4GokuActiveId, name: "Unyielding Fused Kamehameha", effect_description: "...", condition_description: "...", turn: 1, exec_limit: 1, causality_conditions: '{"source":"5","compiled":5}', ultimate_special_id: 77, special_view_id: 15507, costume_special_view_id: 0, bgm_id: 296, skills: ss4GokuActiveSkills },
  ],
  // Fix: Add cardSpecials array based on example SQL comments from sqlGenerator.ts
  cardSpecials: [
    { id: "1062320", card_id: "1062320", special_set_id: "1062321", priority: 0, style: 'Normal', lv_start: 0, eball_num_start: 12, view_id: 15377, card_costume_condition_id: 0, special_bonus_id1: 0, special_bonus_lv1: 0, bonus_view_id1:0, special_bonus_id2:0, special_bonus_lv2:0, bonus_view_id2:0, causality_conditions: null, special_asset_id: null },
    { id: "1062321", card_id: "1062321", special_set_id: "1062321", priority: 0, style: 'Normal', lv_start: 0, eball_num_start: 12, view_id: 15378, card_costume_condition_id: 0, special_bonus_id1: 0, special_bonus_lv1: 0, bonus_view_id1:0, special_bonus_id2:0, special_bonus_lv2:0, bonus_view_id2:0, causality_conditions: null, special_asset_id: null },
    { id: "4062320", card_id: "4062320", special_set_id: "1062322", priority: 0, style: 'Normal', lv_start: 0, eball_num_start: 12, view_id: 12265, card_costume_condition_id: 0, special_bonus_id1: 5, special_bonus_lv1: 20, bonus_view_id1:0, special_bonus_id2:0, special_bonus_lv2:0, bonus_view_id2:0, causality_conditions: null, special_asset_id: null },
    { id: "4062321", card_id: "4062321", special_set_id: "1062322", priority: 0, style: 'Normal', lv_start: 0, eball_num_start: 12, view_id: 12266, card_costume_condition_id: 0, special_bonus_id1: 5, special_bonus_lv1: 20, bonus_view_id1:0, special_bonus_id2:0, special_bonus_lv2:0, bonus_view_id2:0, causality_conditions: null, special_asset_id: null },
  ],
  passiveSkillEffects: [{id: "6232", script_name: "pse6232", lite_flicker_rate: 30, bgm_id: 403}],
  effectPacks: [{id: "306232", category: 1, name: "SSBSSJ4MeetUp", pack_name: "SSBSSJ4MeetUpFLA", scene_name: "ef_001", red:255,green:255,blue:255,alpha:255,lite_flicker_rate:70}],
  isEZA: false,
};
