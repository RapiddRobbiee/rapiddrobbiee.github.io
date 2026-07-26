// Shared ID type for clarity
export type DokkanID = string;
export type Theme =
  | 'classic'
  | 'modern'
  | 'shenron'
  | 'buu'
  | 'vegeta'
  | 'supersaiyan'
  | 'frieza'
  | 'cell'
  | 'zamasu'
  | 'blackfrieza'
  | 'cosmicrift'
  | 'dragonradar'
  | 'destroyer'
  | 'crimson'
  | 'maple'
  | 'premium';

export interface CardForm {
  id: DokkanID;
  name: string;
  character_id: DokkanID;
  card_unique_info_id: DokkanID;
  cost: number;
  rarity: number;
  hp_init: number;
  hp_max: number;
  atk_init: number;
  atk_max: number;
  def_init: number;
  def_max: number;
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
  optimal_awakening_grow_type?: DokkanID | null;

  active_skill_set_id_ref?: DokkanID;
  standby_skill_set_id_ref?: DokkanID; // New field for standby skills

  // Used if this form has a unique skill set not shared
  customPassiveSkillSet?: PassiveSkillSet;
  customLeaderSkillSet?: LeaderSkillSet;
  customActiveSkillSet?: ActiveSkillSet;
}

export interface CardUniqueInfo {
  id: DokkanID;
  name: string;
  kana?: string | null;
}

export interface Character {
  id: DokkanID;
  name: string;
  race: string;
  sex: string;
  size: string;
}

export interface CardCategoryEntry {
  id: DokkanID;
  card_id: DokkanID;
  card_category_id: DokkanID;
  num: number;
}

export interface PassiveSkill {
  id: DokkanID;
  name?: string; // Made optional
  description?: string; // Remains optional, SQL generation will handle its absence
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
  itemized_description?: string | null;
  skills: PassiveSkill[];
}

export interface LeaderSkill {
  id: DokkanID;
  leader_skill_set_id: DokkanID;
  exec_timing_type: number;
  target_type: number;
  sub_target_type_set_id?: DokkanID | null;
  causality_conditions?: string | null;
  efficacy_type: number;
  efficacy_values: string;
  calc_option: number;
}

export interface LeaderSkillSet {
  id: DokkanID;
  name: string;
  description?: string | null;
  skills: LeaderSkill[];
}

export interface Special {
  id: DokkanID;
  special_set_id: DokkanID;
  type: string;
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
  description?: string | null;
  causality_description?: string | null;
  aim_target: number;
  increase_rate: number;
  lv_bonus: number;
  is_inactive: number;
  skills: Special[];
}

export interface CardSpecial {
  id: DokkanID;
  card_id: DokkanID;
  special_set_id: DokkanID;
  priority: number;
  style: string;
  lv_start: number;
  eball_num_start: number;
  view_id: number;
  card_costume_condition_id: number;
  special_bonus_id1: number;
  special_bonus_lv1: number;
  bonus_view_id1: number;
  special_bonus_id2: number;
  special_bonus_lv2: number;
  bonus_view_id2: number;
  causality_conditions?: string | null;
  special_asset_id?: DokkanID | null;
}

export interface ActiveSkillEffect {
  id: DokkanID;
  active_skill_set_id: DokkanID;
  target_type: number;
  sub_target_type_set_id?: DokkanID | null;
  calc_option: number;
  efficacy_type: number;
  eff_val1?: number | string | null;
  eff_val2?: number | string | null;
  eff_val3?: number | string | null;
  efficacy_values?: string;
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
  costume_special_view_id: number; // Defaulted to 0
  bgm_id?: number | null;
  skills: ActiveSkillEffect[];
}

export interface CardActiveSkill {
  id: DokkanID;
  card_id: DokkanID;
  active_skill_set_id: DokkanID;
}

export interface OptimalAwakeningGrowth {
  id: DokkanID;
  optimal_awakening_grow_type: DokkanID; // The ID used in cards.optimal_awakening_grow_type, example '102573'
  step: number; // Formerly val1_eza_marker, example '3'
  lv_max: number; // Formerly val2_max_level, example 150
  skill_lv_max: number; // Formerly val3_skill_lv_max, example 25
  passive_skill_set_id: DokkanID;
  leader_skill_set_id: DokkanID;
}

export interface PassiveSkillEffectEntry {
  id: DokkanID;
  script_name: string;
  lite_flicker_rate: number;
  bgm_id?: number | null;
}

export interface EffectPackEntry {
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

export interface SubTargetTypeSet {
  id: DokkanID;
  created_at?: string;
  updated_at?: string;
}

export interface SubTargetType {
  id: DokkanID;
  sub_target_type_set_id: DokkanID;
  target_value_type: number;
  target_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface UltimateSpecial {
  id: DokkanID;
  name: string;
  description: string;
  increase_rate: number;
  aim_target: number;
  created_at?: string;
  updated_at?: string;
}

export interface SpecialView {
  id: DokkanID;
  script_name: string;
  cut_in_card_id: number;
  special_name_no: number;
  special_motion: number;
  lite_flicker_rate: number;
  energy_color?: number | null;
  special_category_id: number;
  created_at?: string;
  updated_at?: string;
}

// New Standby and Finish Skill Types
export interface StandbySkill {
  id: DokkanID;
  standby_skill_set_id: DokkanID;
  target_type: number;
  target_type_values?: string; // JSON string like '{}'
  sub_target_type_set_id?: DokkanID | null;
  turn: number;
  efficacy_type: number;
  calc_option?: string | null; // Often empty in example
  efficacy_values?: string; // JSON string
  thumb_effect_id?: string | null; // Often empty
  effect_se_id?: string | null; // Often empty
}

export interface StandbySkillSet {
  id: DokkanID;
  name: string;
  ingame_icon_path: string;
  effect_description: string;
  condition_description: string;
  exec_limit: number;
  causality_conditions?: string | null; // JSON string
  special_view_id?: number | null;
  costume_special_view_id: number; // Defaulted to 0
  bgm_id?: number | null;
  skills: StandbySkill[];
  finishSkillSetRelations?: StandbySkillSetFinishSkillSetRelation[]; // Added to hold relations
}

export interface CardStandbySkill {
  // Junction table: card_standby_skill_set_relations
  id: DokkanID; // Row ID for card_standby_skill_set_relations table
  card_id: DokkanID;
  standby_skill_set_id: DokkanID;
}

export interface FinishSkill {
  id: DokkanID;
  finish_skill_set_id: DokkanID;
  target_type: number;
  target_type_values?: string; // JSON string like '{}'
  sub_target_type_set_id?: DokkanID | null;
  turn: number;
  efficacy_type: number;
  calc_option?: string | null;
  efficacy_values?: string; // JSON string
  thumb_effect_id?: string | null;
  effect_se_id?: string | null;
}

export interface FinishSkillSet {
  id: DokkanID;
  name: string;
  effect_description: string;
  condition_description: string;
  dialog_order: number;
  dialog_images?: string; // JSON string, can be null
  exec_timing_type: number;
  exec_limit: number;
  causality_conditions?: string | null; // JSON string
  finish_special_id?: DokkanID | null;
  special_view_id?: number | null;
  costume_special_view_id: number;
  bgm_id?: number | null;
  is_dialog_view_visible: number;
  skills: FinishSkill[];
}

export interface StandbySkillSetFinishSkillSetRelation {
  id: DokkanID; // Row ID for standby_skill_set_finish_skill_set_relations
  standby_skill_set_id: DokkanID;
  finish_skill_set_id: DokkanID;
}

export interface FinishSpecial {
  id: DokkanID; // This is the finish_special_id
  increase_rate: number;
  aim_target: number;
}

export interface BattleParam {
  id: DokkanID; // Row ID for battle_params
  param_no: number;
  idx: number;
  value: number | string; // Can be string due to example '23' for index 7
}

export interface SkillCausality {
  id: DokkanID;
  causality_type: number;
  cau_val1: number | string;
  cau_val2: number | string;
  cau_val3: number | string;
}

export interface CardAwakeningRoute {
  id: DokkanID;
  type: string;
  card_id: DokkanID;
  awaked_card_id: DokkanID;
  num: number;
  card_awakening_set_id: DokkanID;
  optimal_awakening_step?: number | null;
  optimal_awakening_type?: number | null;
  description?: string | null;
  priority: number;
  open_at: number;
  created_at?: string;
  updated_at?: string;
}

export interface DokkanPatchState {
  cardForms: CardForm[];
  cardUniqueInfos: CardUniqueInfo[];
  characters: Character[];

  passiveSkillSets: PassiveSkillSet[];
  leaderSkillSets: LeaderSkillSet[];
  specialSets: SpecialSet[];
  activeSkillSets: ActiveSkillSet[];

  cardSpecials: CardSpecial[];
  cardActiveSkills: CardActiveSkill[]; // Added for consistency if managing this table directly
  cardStandbySkills: CardStandbySkill[]; // New

  passiveSkillEffects: PassiveSkillEffectEntry[];
  effectPacks: EffectPackEntry[];

  standbySkillSets: StandbySkillSet[]; // New
  // StandbySkills are part of StandbySkillSet
  finishSkillSets: FinishSkillSet[]; // New
  // FinishSkills are part of FinishSkillSet
  standbySkillSetFinishSkillSetRelations: StandbySkillSetFinishSkillSetRelation[]; // New
  finishSpecials: FinishSpecial[]; // New
  battleParams: BattleParam[]; // New
  skillCausalities: SkillCausality[]; // New
  subTargetTypeSets: SubTargetTypeSet[]; // New
  subTargetTypes: SubTargetType[]; // New
  ultimateSpecials: UltimateSpecial[]; // New
  specialViews: SpecialView[]; // New
  cardAwakeningRoutes: CardAwakeningRoute[]; // New

  isEZA: boolean;
  baseCardIdForEZA?: DokkanID;
  optimalAwakeningGrowth?: OptimalAwakeningGrowth;

  // New state for SQL Converter
  sqlConverterInput?: string;
  sqlConverterOutput?: string;
}

export interface PlannedSuperAttack {
  id: DokkanID;
  name: string;
  text: string;
}

export interface PlannedMiscSection {
  id: DokkanID;
  title: string;
  text: string;
}

export interface PlannedCard {
  dokkanCardId?: DokkanID;
  plannerCardId: DokkanID;
  name: string;
  title: string;
  element: number;
  rarity: number;
  hpBase?: number;
  hpMax?: number;
  atkBase?: number;
  atkMax?: number;
  defBase?: number;
  defMax?: number;
  cost?: number;
  leaderSkillText: string;
  passiveSkillText: string;
  superAttacks: PlannedSuperAttack[];
  activeSkillName: string;
  activeSkillConditions: string;
  activeSkillText: string;
  categoryIds?: DokkanID[];
  linkSkillIds?: DokkanID[];
  miscSections: PlannedMiscSection[];
}

export interface PlannerSlot {
  slotId: number;
  name?: string;
  cards: PlannedCard[];
  lastUpdated?: number;
}

export interface PlannerTemplate {
  id: string;
  name: string;
  description?: string;
  card: Omit<PlannedCard, 'plannerCardId'>;
  createdAt: number;
  updatedAt: number;
}

export interface CardFormTemplate {
  id: string;
  name: string;
  description?: string;
  cardForm: any; // CardForm + associated data
  createdAt: number;
  updatedAt: number;
}

export enum GeminiTaskType {
  GENERATE_PASSIVE_DESCRIPTION = 'GENERATE_PASSIVE_DESCRIPTION',
  GENERATE_LEADER_DESCRIPTION = 'GENERATE_LEADER_DESCRIPTION',
  SUGGEST_CAUSALITY_JSON = 'SUGGEST_CAUSALITY_JSON',
  SUGGEST_EFFICACY_TYPE = 'SUGGEST_EFFICACY_TYPE',
}

export interface GeminiRequestPayload {
  taskType: GeminiTaskType;
  data: any;
}

export interface CardBasicInfo {
  id: DokkanID;
  name: string;
  title?: string | null;
  rarity: number;
  element: number;
}

// For ImportSkillsModal
export type TargetSkillSetType =
  | 'passiveSkillSets'
  | 'leaderSkillSets'
  | 'specialSets'
  | 'activeSkillSets'
  | 'standbySkillSets'
  | 'finishSkillSets';

export type AnySkill =
  | PassiveSkill
  | LeaderSkill
  | Special
  | ActiveSkillEffect
  | StandbySkill
  | FinishSkill;
export type AnySkillSet =
  | PassiveSkillSet
  | LeaderSkillSet
  | SpecialSet
  | ActiveSkillSet
  | StandbySkillSet
  | FinishSkillSet;

// Raw row from cards table for intermediate fetching
export interface CardDBRow {
  id: DokkanID;
  name: string;
  passive_skill_set_id?: DokkanID | null;
  leader_skill_set_id?: DokkanID | null;
  // active_skill_set_id might be via card_active_skills
  // standby_skill_set_id might be via card_standby_skill_set_relations
  [key: string]: any; // For other card fields
}

export interface AppSettings {
  appLayout: 'dock' | 'ide' | 'hub';
  autoExpandFirstCard: boolean;
  defaultAdvancedOpen: boolean;
  confirmOnDelete: boolean;
  autoGenerateSqlOnTabSwitch: boolean;
  enableAnimations: boolean;
  stickyNavbar: boolean;
  enableVisualCausalityEditor: boolean;
  enableReverseSqlImport: boolean;
  enableStandbyFinishSkills: boolean;
  syncAlphaBetaEdits: boolean;
}

export type Settings = AppSettings;

export interface LayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  tabs: Tab[];
  settings: Settings;
  generatedSql: string;
  handleGenerateSql: () => void;
  isLoadingSql: boolean;
  anyOperationLoading: boolean;
  handleResetForm: () => void;
  loginSystemEnabled: boolean;
  currentUser: any;
  setShowSaveLoadModal: (show: boolean) => void;
  setShowVersionNotesModal: (show: boolean) => void;
  setShowReportBugModal: (show: boolean) => void;
  lastSavedTime: Date | null;
  children: React.ReactNode;
}

export interface Tab {
  name: string;
  id: string;
  icon: string;
}
