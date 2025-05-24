
// Shared ID type for clarity
export type DokkanID = string;

export interface CardForm {
  id: DokkanID;
  name: string;
  character_id: DokkanID;
  card_unique_info_id: DokkanID;
  cost: number;
  rarity: number;
  hp_init: number; hp_max: number;
  atk_init: number; atk_max: number;
  def_init: number; def_max: number;
  element: number;
  lv_max: number;
  skill_lv_max: number;
  grow_type: number;
  price: number;
  exp_type: number;
  training_exp: number;
  special_motion: number; // 0 or 1 usually, LRs can have 4
  passive_skill_set_id: DokkanID;
  leader_skill_set_id: DokkanID;
  link_skill_ids: DokkanID[];
  category_ids: DokkanID[];
  eball_mod_min: number;
  eball_mod_num100: number;
  eball_mod_mid: number;
  eball_mod_mid_num: number;
  eball_mod_max: number;
  eball_mod_max_num: number;
  max_level_reward_id: DokkanID;
  max_level_reward_type: string; // e.g. '1'
  collectable_type: number;
  face_x: number;
  face_y: number;
  aura_id?: DokkanID | null;
  is_selling_only: number;
  awakening_element_type?: number | null;
  potential_board_id?: DokkanID | null;
  
  // For linking to card_active_skills
  active_skill_set_id_ref?: DokkanID; // Points to an ActiveSkillSet.id

  // Used if this form has a unique skill set not shared
  customPassiveSkillSet?: PassiveSkillSet;
  customLeaderSkillSet?: LeaderSkillSet; // LRs might have custom leader skills but often share one
  customActiveSkillSet?: ActiveSkillSet;
}

export interface CardUniqueInfo {
  id: DokkanID;
  name: string;
  kana?: string | null;
}

export interface CardCategoryEntry {
  id: DokkanID;
  card_id: DokkanID;
  card_category_id: DokkanID;
  num: number;
}

export interface PassiveSkill {
  id: DokkanID;
  name: string; // Often same as PassiveSkillSet name
  description: string; // Often same as PassiveSkillSet name
  exec_timing_type: number;
  efficacy_type: number;
  target_type: number;
  sub_target_type_set_id?: DokkanID | null;
  passive_skill_effect_id?: DokkanID | null;
  calc_option: number;
  turn: number;
  is_once: number; // 0 or 1
  probability: number; // 0-100
  causality_conditions?: string | null; // JSON string
  eff_value1?: number | string | null;
  eff_value2?: number | string | null;
  eff_value3?: number | string | null;
  efficacy_values?: string; // JSON string, default '{}'
}

export interface PassiveSkillSet {
  id: DokkanID;
  name: string;
  description: string; // User-facing, Gemini can help generate
  itemized_description?: string; // Formatted, Gemini can help
  skills: PassiveSkill[]; // The actual passive_skill entries
}

export interface LeaderSkill {
  id: DokkanID;
  leader_skill_set_id: DokkanID; // Links back to parent
  exec_timing_type: number;
  target_type: number;
  sub_target_type_set_id?: DokkanID | null;
  causality_conditions?: string | null;
  efficacy_type: number;
  efficacy_values: string; // JSON string like '[val1, val2, val3]'
  calc_option: number;
}

export interface LeaderSkillSet {
  id: DokkanID;
  name: string;
  description: string; // User-facing, Gemini can help
  skills: LeaderSkill[];
}

export interface Special { // Represents one row in 'specials' table
  id: DokkanID;
  special_set_id: DokkanID; // Links back to parent
  type: string; // e.g. 'Special::NormalEfficacySpecial'
  efficacy_type: number;
  target_type: number;
  calc_option: number;
  turn: number;
  prob: number;
  causality_conditions?: string | null;
  eff_value1?: number | string | null;
  eff_value2?: number | string | null;
  eff_value3?: number | string | null;
}

export interface SpecialSet {
  id: DokkanID;
  name: string;
  description: string;
  causality_description?: string | null;
  aim_target: number;
  increase_rate: number;
  lv_bonus: number;
  is_inactive: number; // 0 or 1
  skills: Special[];
}

export interface CardSpecial { // Represents one row in 'card_specials'
  id: DokkanID; // This is the ID of the card_specials row itself
  card_id: DokkanID; // The ID of the card this special belongs to
  special_set_id: DokkanID; // The ID of the SpecialSet defining this special's effects
  priority: number; // Differentiates specials for the same card (e.g. 0 for 12 ki, 1 for 18ki)
  style: string; // e.g., 'Normal', 'Hyper' (for Ultra Super Attack)
  lv_start: number; // Min SA level for this special to activate
  eball_num_start: number; // Ki required, e.g., 12 or 18
  view_id: number; // Animation/view ID for this specific special
  card_costume_condition_id: number; // usually 0
  special_bonus_id1: number; // usually 0
  special_bonus_lv1: number; // usually 0
  bonus_view_id1: number; // usually 0
  special_bonus_id2: number; // usually 0
  special_bonus_lv2: number; // usually 0
  bonus_view_id2: number; // usually 0
  causality_conditions?: string | null;
  special_asset_id?: DokkanID | null;
}

export interface ActiveSkillEffect {
  id: DokkanID;
  active_skill_set_id: DokkanID; // Links back to parent
  target_type: number;
  sub_target_type_set_id?: DokkanID | null;
  calc_option: number;
  efficacy_type: number;
  eff_val1?: number | string | null;
  eff_val2?: number | string | null;
  eff_val3?: number | string | null;
  efficacy_values?: string; // JSON string, default '{}'
  thumb_effect_id?: number | null;
  effect_se_id?: number | null;
}

export interface ActiveSkillSet {
  id: DokkanID;
  name: string;
  effect_description: string;
  condition_description: string;
  turn: number;
  exec_limit: number;
  causality_conditions?: string | null;
  ultimate_special_id?: number | null;
  special_view_id?: number | null;
  costume_special_view_id?: number | null;
  bgm_id?: number | null;
  skills: ActiveSkillEffect[];
}

export interface CardActiveSkill { // Represents one row in 'card_active_skills'
    id: DokkanID;
    card_id: DokkanID;
    active_skill_set_id: DokkanID;
}

export interface OptimalAwakeningGrowth {
  id: DokkanID; // Row ID for optimal_awakening_growths table
  growth_type_id: DokkanID; // The ID used in cards.optimal_awakening_grow_type
  val1_eza_marker: number; // e.g., 7 for URs, or 'step' in some contexts
  val2_max_level: number; // e.g., 140
  val3_skill_lv_max: number; // e.g., 15 or 25 for LRs
  passive_skill_set_id: DokkanID;
  leader_skill_set_id: DokkanID; // Original or new leader skill set id for EZA
}

export interface PassiveSkillEffectEntry { // for passive_skill_effects table
  id: DokkanID;
  script_name: string;
  lite_flicker_rate: number;
  bgm_id?: number | null;
}

export interface EffectPackEntry { // for effect_packs table
  id: DokkanID;
  category: number;
  name: string;
  pack_name: string;
  scene_name: string;
  red: number;
  green: number;
  blue: number;
  alpha: number;
  lite_flicker_rate: number;
}


export interface DokkanPatchState {
  cardForms: CardForm[];
  cardUniqueInfos: CardUniqueInfo[];
  
  // Skill sets that are defined once and potentially referenced by multiple card forms
  // Or, new skill sets specific to this patch.
  // IDs here must match IDs used in CardForm skill_set_id fields.
  passiveSkillSets: PassiveSkillSet[];
  leaderSkillSets: LeaderSkillSet[]; 
  specialSets: SpecialSet[];
  activeSkillSets: ActiveSkillSet[];

  // Junction table entries
  cardSpecials: CardSpecial[]; // Handles multiple specials per card (e.g. LR 12ki/18ki)

  // Entries for misc tables like passive_skill_effects, effect_packs
  passiveSkillEffects: PassiveSkillEffectEntry[];
  effectPacks: EffectPackEntry[];
  
  // EZA specific details
  isEZA: boolean;
  baseCardIdForEZA?: DokkanID; 
  optimalAwakeningGrowth?: OptimalAwakeningGrowth;
}

// For Gemini interactions
export enum GeminiTaskType {
  GENERATE_PASSIVE_DESCRIPTION = "GENERATE_PASSIVE_DESCRIPTION",
  GENERATE_LEADER_DESCRIPTION = "GENERATE_LEADER_DESCRIPTION",
  SUGGEST_CAUSALITY_JSON = "SUGGEST_CAUSALITY_JSON",
  SUGGEST_EFFICACY_TYPE = "SUGGEST_EFFICACY_TYPE",
}

export interface GeminiRequestPayload {
  taskType: GeminiTaskType;
  data: any; 
}

// For Database interactions
export interface CardBasicInfo {
  id: DokkanID;
  name: string;
  title?: string | null; 
  rarity: number;
  element: number;
}