
// Fix: Import necessary types from ../types
import {DokkanID, CardForm, PassiveSkill, LeaderSkill, Special, ActiveSkillEffect, CardSpecial} from './types';

export const ELEMENT_TYPES: { [key: number]: string } = {
  0: 'AGL', 1: 'TEQ', 2: 'INT', 3: 'STR', 4: 'PHY',
  10: 'Super AGL', 11: 'Super TEQ', 12: 'Super INT', 13: 'Super STR', 14: 'Super PHY',
  20: 'Extreme AGL', 21: 'Extreme TEQ', 22: 'Extreme INT', 23: 'Extreme STR', 24: 'Extreme PHY'
};
export const ELEMENT_TYPE_OPTIONS = Object.entries(ELEMENT_TYPES)
  .map(([value, label]) => ({ label, value: parseInt(value) }))
  .sort((a,b) => a.value - b.value);


export const RARITY_TYPES: { [key: number]: string } = {
  3: 'SSR', 
  4: 'UR',
  5: 'LR'
};
export const RARITY_TYPE_OPTIONS = Object.entries(RARITY_TYPES).map(([value, label]) => ({ label, value: parseInt(value) }));

export const CALC_OPTIONS: { [key: number]: string } = {
  0: 'Calc Plus', 1: 'Calc Minus', 2: 'Calc Percent Plus', 3: 'Calc Percent Minus', 4: 'Calc Equal'
};
export const CALC_OPTION_OPTIONS = Object.entries(CALC_OPTIONS).map(([value, label]) => ({ label, value: parseInt(value) }));

export const EXEC_TIMING_TYPES: { [key: number]: string } = {
  1: 'Start Round', 2: 'Link Skills', 3: 'Your Turn', 4: 'On Player Attack', 5: 'Enemy Turn',
  6: 'Before Player Hit', 7: 'After Player Hit', 8: 'Battle Result Phase', 9: 'End Round',
  10: 'Start Turn', 11: 'End of Puzzle Phase', 12: 'Start of Puzzle Phase', 14: 'After delivering a final blow',
  15: 'Acquired Energy Ball', 17: 'Dokkan Field Efficacies', 18: 'Dokkan Field'
};
export const EXEC_TIMING_TYPE_OPTIONS = Object.entries(EXEC_TIMING_TYPES).map(([value, label]) => ({ label: `${value}: ${label}`, value: parseInt(value) }));


export const TARGET_TYPES: { [key: number]: string } = {
  0: 'None', 1: 'Self', 2: 'Party All', 3: 'Enemy', 4: 'Enemy All', 5: 'Self And Target',
  6: 'Party Race Type', 7: 'Party Exist Chara', 8: 'Target Excepct',
  9: 'Target Party Enemy Attack Order', 10: 'Slot Attacker', 11: 'Party Slot Random',
  12: 'Party Super Class', 13: 'Party Extreme Class', 14: 'Enemy Super Class',
  15: 'Enemy Extreme Class', 16: 'Party All (self excluded)'
};
export const TARGET_TYPE_OPTIONS = Object.entries(TARGET_TYPES).map(([value, label]) => ({ label: `${value}: ${label}`, value: parseInt(value) }));

// Fix: Add optional efficacy_values to the EFFICACY_TYPES definition
export const EFFICACY_TYPES: { [key: number]: { name: string, params: string[], efficacy_values?: string } } = {
  1: { name: 'Change Atk Param', params: ['Atk Value'] },
  2: { name: 'Change Def Param', params: ['Def Value'] },
  3: { name: 'Change Atk Def Param', params: ['Atk Value', 'Def Value'] },
  4: { name: 'Change Heal HP', params: ['Hp Value'] },
  5: { name: 'Change Energy Param', params: ['Ki Value'] },
  8: { name: 'Change Condition Delay', params: [] }, // eff_values 0, use probability, target enemy/all
  9: { name: 'Change Condition Stun', params: [] }, // eff_values 0, use probability, target enemy/all
  11: { name: 'Change Attack Order', params: [] },
  12: { name: 'Change Pain Attack', params: [] },
  13: { name: 'Change Resist Damage', params: ['100-Reduction Value (%)'] },
  16: { name: 'Change Element Type Atk', params: ['ATK (Element) Value'] },
  17: { name: 'Change Element Type Def', params: ['DEF (Element) Value'] },
  18: { name: 'Change Element Type Atk Def', params: ['ATK (Element) Value', 'DEF (Element) Value'] },
  19: { name: 'Change Element Type Hp Param', params: ['HP (Element) Value'] },
  20: { name: 'Change Element Type Energy Param', params: ['KI (Element) Value'] },
  21: { name: 'Change Recovery', params: [] },
  22: { name: 'Change Condition Heal', params: [] },
  24: { name: 'Change Guard Break', params: [] }, // eff_values 0, use probability, target enemy/all
  26: { name: 'Change Absorb Special Energy', params: [] },
  27: { name: 'Change Resist Special Damage', params: ['100-Reduction Value'] },
  28: { name: 'Change Absorb Deal Damage', params: ['Recovery Value (%)'] },
  34: { name: 'Change Dokkan Gauge Bonus', params: [] },
  35: { name: 'Change Heal Bonus', params: [] },
  36: { name: 'Change Special Bonus', params: [] },
  37: { name: 'Change Energy Bonus', params: [] },
  38: { name: 'Change Link Skill Bonus', params: ['Link Effect Value Boost (%)'] },
  39: { name: 'Change Element Type Energy Bonus', params: [] },
  40: { name: 'Change Element Type Linkage Bonus', params: [] },
  43: { name: 'Change Hp Atk', params: ['HP Value', 'ATK Value'] }, // Docs unclear, assuming order or single values
  44: { name: 'Change Element Type Hp Atk', params: ['Element Value', 'HP Value', 'ATK Value'] }, // Docs unclear
  46: { name: 'Change Passive Probability Bonus', params: [] },
  47: { name: 'Change Condition Psychic', params: [] }, // eff_values 0, use probability, target enemy/all
  48: { name: 'Change Condition Seal', params: [] }, // eff_values 0, use probability, target enemy/all
  50: { name: 'Change Invalid Bad Condition', params: [] }, // eff_values 0, use probability, target private/all allies
  51: { name: 'Change Energy Ball Color', params: ['Change KI Orb (Element ID)', 'Target KI Orb (Element ID)'] },
  52: { name: 'Change Resurrection', params: [] }, // eff_values 0, use probability, target private/all allies
  53: { name: 'Ignore Enemy Defense', params: [] }, // eff_values 0, use probability, target private/all allies
  54: { name: 'Change Invalid Combination Attack Bonus', params: [] },
  55: { name: 'Change Target Def And Self Atk', params: ['Target DEF Debuff', 'Self ATK Buff'] }, // Docs unclear
  56: { name: 'Change Target Def And Self Def', params: ['Target DEF Debuff', 'Self DEF Buff'] }, // Docs unclear
  57: { name: 'Change Target Def And Self Energy', params: ['Target DEF Debuff', 'Self Ki Buff'] }, // Docs unclear
  58: { name: 'Change Energy Ball Heal', params: ['Heal per Orb'] }, // Docs unclear
  59: { name: 'Change Energy Ball Proportional Atk', params: ['ATK Value per Orb'] },
  60: { name: 'Change Energy Ball Proportional Def', params: ['DEF Value per Orb'] },
  61: { name: 'Change Energy Ball Proportional Atk Def', params: ['ATK Value per Orb', 'DEF Value per Orb'] },
  63: { name: 'Change Special Energy Cost', params: ['Ki Cost Change'] }, // Docs unclear
  64: { name: 'Change Element Type Energy Ball Proportional Atk', params: ['Element Value (0-4)', 'ATK Boost Value (%)', 'Element Value (0-4)'] },
  65: { name: 'Change Element Type Energy Ball Proportional Def', params: ['Element Value (0-4)', 'DEF Boost Value (%)', 'Element Value (0-4)'] },
  66: { name: 'Change Element Type Energy Ball Proportional Atk Def', params: ['Element Value (0-4)', 'ATK & DEF Boost Value (%)', 'Element Value (0-4)'] },
  67: { name: 'Change Energy Ball Color Bitpattern', params: ['Target Ki Orb Bitset', 'Change To Ki Orb Bitset'] },
  68: { name: 'Change Energy Ball Proportional Bitpattern', params: ['Energy Ball Bitset', 'Stat (1:ATK,2:HP,3:DEF,4:Crit,5:Eva,6:DR)', 'Value'] },
  69: { name: 'Change Energy Ball Color Specify Random', params: ['Change All Orbs to (Element ID)', 'Insert 1', 'Insert 1'] },
  70: { name: 'Change Energy Ball Color Specify Random Without Obstacles', params: [] },
  71: { name: 'Change Hp Range Atk', params: ['ATK Boost At MIN HP (%)', 'ATK Boost At MAX HP (%)', 'Always 1100'] },
  72: { name: 'Change Hp Range Def', params: ['DEF Boost At MIN HP (%)', 'DEF Boost At MAX HP (%)', 'Always 1100'] },
  73: { name: 'Change Hp Range Atk Def', params: ['ATK & DEF Boost At MIN HP (%)', 'ATK & DEF Boost At MAX HP (%)', 'Always 1100'] },
  74: { name: 'Change Hp Range Ball Heal', params: [] },
  75: { name: 'Change Condition Disable Swap', params: [] },
  76: { name: 'Change Condition Super Effective Atk', params: [] }, // eff_values 0, use probability
  77: { name: 'Change Reset Ball Color', params: [] },
  78: { name: 'Guard Against All Attacks', params: [] }, // eff_values 0, use probability
  79: { name: 'Metamorphic Transformation (Rage, Giant Ape, etc.)', params: ['Transform Card Id', 'battle_params Set #1', 'battle_params Set #2'] },
  80: { name: 'Change Counter Attack', params: ['Dmg Reduction % (Optional)', 'Counter Multiplier', 'Lua Script #'] },
  81: { name: 'Change Extra Attack', params: ['Unused', 'Prob Second Attack', 'Prob of Super Attack'] },
  82: { name: 'Change Element Type Hp Atk Def', params: ['Type Bitset', 'Boost Value'] },
  83: { name: 'Change Element Type Energy Bitpattern', params: ['Type Bitset', 'Boost Value'] },
  84: { name: 'Change Suicide Attack', params: [] },
  85: { name: 'Change Step Extra Attack', params: [] },
  86: { name: 'Change Special Atk Rate', params: [] },
  87: { name: 'Change Element Type Attack Coef', params: [] },
  88: { name: 'Change Element Type Defense Coef', params: [] },
  89: { name: 'Change Element Type Attack Defense Coef', params: [] },
  90: { name: 'Change Critical Attack', params: ['Probability'] },
  91: { name: 'Change Dodge', params: ['Probability'] },
  92: { name: 'Change Always Hit', params: [] },
  93: { name: 'Change Element Type Bitpattern Hp', params: [] },
  94: { name: 'Change Invalidate Stun', params: [] },
  95: { name: 'Change Dodge Counter Attack', params: ['battle_params param_no', 'Counter Multiplier', 'Lua Script #'] },
  96: { name: 'Change Energy Ball Additional Point', params: ['Energy Ball Bitset', 'Ki Value'] },
  97: { name: 'Change Absorb Special', params: ['Recover HP %?', 'Special Category Raw Attribute', 'Animation ID'] },
  98: { name: 'Change Incremental Param', params: ['Increase Value', 'Max Value', 'Stat (0:Atk,1:Def,2:Crit,3:Dodge,4:DR,5:Ki)'] },
  99: { name: 'Change Invalidate Status Down', params: [] },
  100: { name: 'Change Invalidate Astute', params: [] }, // Astute seems to mean Seal/Stun related
  101: { name: 'Change Prediction', params: [] }, // (Scouter) eff_values 0, use probability
  102: { name: 'Change Metamorphic Probability Count Limit', params: [] },
  103: { name: 'Transformation', params: ['Transform Card Id', 'Turn Req.', 'battle_params param_no'] },
  104: { name: 'Change HP Atk Def', params: ['HP Value', 'ATK Value', 'DEF Value'] },
  105: { name: 'Replace Energy Ball', params: ['Energy Ball Bitset', 'Unknown', 'Unknown'] },
  106: { name: 'Potential Heal', params: ['Unknown', 'Unknown', 'Unknown'] },
  107: { name: 'Change Condition Stackable Delay', params: ['Delay turn count', '0', '0'] },
  108: { name: 'Add Potential Skill Variable Parameter (nullptr)', params: ['Unknown', 'Unknown', 'Unknown'] },
  109: { name: 'Revival Skill', params: ['HP% to heal', 'effect_pack Row', 'BGM ID'], efficacy_values: '{"priority":int}' },
  110: { name: 'Remove Ability Efficacy Info And Inactive Ability Status', params: ['Skill Types Table ID', 'Skill ID', 'Skill Category Types Table ID'] },
  111: { name: 'Change Condition Attack Break', params: [] }, // "Interrupt", eff_values 0, use probability
  112: { name: 'Change Invalidate Attack Break', params: [] },
  113: { name: 'Threshold Damage', params: [] },
  114: { name: 'Cannot Attack (nullptr)', params: [], efficacy_values: '{"text":string,"script_path":string}' },
  115: { name: 'Update Standby Mode', params: [], efficacy_values: '{"type":string,"is_active":bool}' }, // types: charge, revival, special_counter
  116: { name: 'Charge Start', params: [], efficacy_values: '{"type":string,"gauge_value":int array,"count_multiplier":int,"max_effect_value":int,"ball_type_multiplier":int array}' }, // types: energy_ball,attack,normal_attack,special_attack,recived_attack,guard,dodge
  117: { name: 'End Transformation', params: [] },
  118: { name: 'Add Special Atk Rate By Charge Count', params: [] },
  119: { name: 'Counter Attack Behaviour (nullptr)', params: ['Unknown'] },
  120: { name: 'Counter Attack (Same as 80)', params: ['Dmg Reduction % (Optional)', 'Counter Multiplier', 'Lua Script #'] }, // (Same as eff 80)
  121: { name: 'Unknown (nullptr)', params: [] },
  122: { name: 'Increased Received Damage', params: ['Received Damage Value %'] },
  123: { name: 'Target Focus', params: [] }, // eff_values 0, use probability
  124: { name: 'Incremental Critical Probability For Enemy', params: ['Unknown', 'Unknown', 'Unknown'] },
  125: { name: 'Hp Damage', params: ['Damage Value'] }, // For Enemies always use target type 11
  126: { name: 'Reflect Damage', params: ['Damage Value'], efficacy_values: '{"text":string,"script_path":string}' }, // For Enemies always use target type 11. Use Exec timing type 5
  127: { name: 'Set Plug In On Energy Ball With Bitpattern', params: ['Unknown', 'Unknown', 'Unknown'] },
  128: { name: 'Dodge Counter Attack Behaviour', params: ['Unknown', 'Unknown', 'Unknown'] },
  129: { name: 'Change Invalidate Always Hit', params: ['Unknown', 'Unknown', 'Unknown'] },
  131: { name: 'Transform/Exchange', params: ['Target Card ID', 'Condition Turn (0 = no turn limit)', 'Passive Skill Effect ID for transition animation (optional)'] },

};
export const EFFICACY_TYPE_OPTIONS = Object.entries(EFFICACY_TYPES).map(([value, data]) => ({ label: `${value}: ${data.name}`, value: parseInt(value) }));


export const CAUSALITY_TYPES: { [key: number]: {name: string, params: string[] }} = {
  0: { name: 'isNoneRule', params: [] },
  1: { name: 'isOverHpRate', params: ['HP Percent'] },
  2: { name: 'isUnderHpRate', params: ['HP Percent'] },
  3: { name: 'isOverEnergy', params: ['Ki Amount'] },
  4: { name: 'isUnderEnergy', params: ['Ki Amount'] },
  5: { name: 'isElapsedTurn', params: ['Turn'] },
  6: { name: 'isPartyRaceType', params: ['Link Skill ID'] },
  7: { name: 'isEnemyRaceType', params: ['Link Skill ID'] },
  8: { name: 'isOverFightingPower', params: ['Attack', 'Defense'] },
  9: { name: 'isUnderFightingPower', params: ['Attack', 'Defense'] },
  10: { name: 'isOverHpRateOverEnergy', params: ['HP Percent', 'Ki Amount'] },
  11: { name: 'isOverHpRateUnderEnergy', params: ['HP Percent', 'Ki Amount'] },
  12: { name: 'isUnderHpRateOverEnergy', params: ['HP Percent', 'Ki Amount'] },
  13: { name: 'isUnderHpRateUnderEnergy', params: ['HP Percent', 'Ki Amount'] },
  14: { name: 'isFirstAttack', params: [] },
  15: { name: 'isOverTargetNum', params: ['Number of Enemies'] },
  16: { name: 'isUnderTargetNum', params: ['Number of Enemies'] },
  17: { name: 'isOverTargetHpRate', params: ['HP Percent'] },
  18: { name: 'isUnderTargetHpRate', params: ['HP Percent'] },
  19: { name: 'isAttackOrder', params: ['Slot (0, 1, 2)'] },
  20: { name: 'isOverEnergyCondition', params: ['Ki Percent'] },
  21: { name: 'isUnderEnergyCondition', params: ['Ki Percent'] },
  22: { name: 'isPartyExistChara', params: ['Card Unique Info ID'] },
  23: { name: 'isLinkNum', params: ['Number of links'] },
  24: { name: 'isHitDamaged', params: [] },
  25: { name: 'isTargetKill', params: [] },
  26: { name: 'isOverHpRateEnableSpecial', params: ['HP Percent'] },
  27: { name: 'isUnderHpRateEnableSpecial', params: ['HP Percent'] },
  28: { name: 'isSlotElementType', params: ['Element Type'] },
  29: { name: 'isEnemyExistChara', params: ['Card Unique Info ID'] },
  30: { name: 'isGuardSuccess', params: [] },
  31: { name: 'isCombinationAttack', params: [] },
  32: { name: 'isChangeEnergyBallColor', params: ['Ki Type'] },
  33: { name: 'isBetweenHpRate', params: ['HP Percent Lower', 'HP Percent Higher'] },
  34: { name: 'isOverTeamCategoryNum', params: ['Target (0:deck,1:enemy,2:ally in turn)', 'Category ID', 'Amount'] },
  35: { name: 'hasAllElementBitpatternCards', params: ['Element Bitset'] },
  36: { name: 'isOverHpRateAndElapsedTurn', params: ['HP Percent', 'Turn'] },
  37: { name: 'isUnderHpRateAndElapsedTurn', params: ['HP Percent', 'Turn'] },
  38: { name: 'isTargetEnemyCondition', params: ['Status Effect Flags', 'Unknown'] },
  39: { name: 'isTargetElementTypeBitPattern', params: ['Element Bitset'] },
  40: { name: 'isSpecialAttack', params: [] },
  41: { name: 'isOverTeamUniqueCardNum', params: ['Unknown', 'Card Unique Info ID', 'Unknown'] },
  42: { name: 'isEnergyBallGetNum', params: ['Energy Ball Bitset', 'Ki Amount'] },
  43: { name: 'isDodgeSuccess', params: ['Unknown', 'Unknown', 'Unknown'] },
  44: { name: 'isCountUp', params: ['Action (1:SA,2:Attack,3:DmgRecv,4:Guard,5:Evade)', 'Amount'] },
  45: { name: 'isContainsCardByCategoryAndUniqueInfo', params: ['Target', 'Category ID', 'card_unique_info_set_relations ID'] },
  46: { name: 'isContainsSpecifiedElemenets', params: ['Target (0:deck,1:enemy,2:ally in turn)', 'Type Bitset', 'Amount'] },
  47: { name: 'isExecutedRevivalSkill', params: [] },
  48: { name: 'isAttackedByEnemyWhichTakeSpecialDamage', params: ['special_categories.raw_attribute'] },
  49: { name: 'isAttackedBySpecialCategory', params: ['special_categories.raw_attribute', 'Unknown', 'Unknown'] },
  50: { name: 'hasPlayedPassiveSkillEffect', params: ['Unknown', 'Unknown', 'Unknown'] },
  51: { name: 'isUnderTurnCountFromApperance', params: ['Turn count'] },
  52: { name: 'chargeCount', params: ['Unknown', 'Unknown', 'Unknown'] },
  53: { name: 'inStandbyMode', params: ['Unknown (usually 0)'] },
  54: { name: 'isPartyExecutedRevivalSkill', params: [] },
  55: { name: 'isOverTurnCountFromApperance', params: ['Turn count'] },
  56: { name: 'isNormalAttack', params: ['Unknown', 'Unknown', 'Unknown'] },
  57: { name: 'isInSpecifiedDokkanField', params: ['dokkan_field.id'] },
  58: { name: 'isInDokkanField', params: ['0=no, 1=yes'] },
  59: { name: 'isSameAwakeningElementType', params: ['Super Class=1, Extreme Class=2'] },
  60: { name: 'isInSubTargetTypeSet', params: ['SubTargetTypeSet ID'] },
  61: { name: 'isReceivedAttackDuringTurn', params: [] },
  62: { name: 'isAttackerElementTypeBitPattern', params: ['Element Bitset'] },
  63: { name: 'isElapsedTurnPerRound', params: ['Turn', 'Round ID?'] },
};
export const CAUSALITY_TYPE_OPTIONS = Object.entries(CAUSALITY_TYPES).map(([value, data]) => ({ label: `${value}: ${data.name}`, value: parseInt(value) }));

// Fix: Change return type to CardForm
export const INITIAL_CARD_FORM: () => CardForm = () => ({
  id: '', name: '', character_id: '', card_unique_info_id: '', cost: 0, rarity: 4, // Default rarity to UR (4)
  hp_init: 0, hp_max: 0, atk_init: 0, atk_max: 0, def_init: 0, def_max: 0,
  element: 0, lv_max: 120, skill_lv_max: 10, grow_type: 0, price: 0, exp_type: 0, training_exp: 0,
  special_motion: 0, passive_skill_set_id: '', leader_skill_set_id: '',
  link_skill_ids: Array(7).fill(''), category_ids: [],
  eball_mod_min: 0, eball_mod_num100: 0, eball_mod_mid: 0, eball_mod_mid_num: 0,
  eball_mod_max: 0, eball_mod_max_num: 0, max_level_reward_id: '1', max_level_reward_type: '1',
  collectable_type: 1, face_x: 0, face_y: 0, aura_id: null, is_selling_only: 0,
  awakening_element_type: null, potential_board_id: null,
  active_skill_set_id_ref: '',
});

export const INITIAL_PASSIVE_SKILL: () => PassiveSkill = () => ({
  id: '', name: '', description: '', exec_timing_type: 1, efficacy_type: 1, target_type: 1,
  calc_option: 2, turn: 1, is_once: 0, probability: 100, causality_conditions: null,
  eff_value1: 0, eff_value2: 0, eff_value3: 0, efficacy_values: '{}',
  sub_target_type_set_id: null, passive_skill_effect_id: null,
});

export const INITIAL_LEADER_SKILL: () => LeaderSkill = () => ({
  id: '', leader_skill_set_id: '', exec_timing_type: 1, target_type: 2, efficacy_type: 5,
  efficacy_values: '[3,0,0]', calc_option: 0, sub_target_type_set_id: null, causality_conditions: null,
});

export const INITIAL_SPECIAL_SKILL: () => Special = () => ({
  id: '', special_set_id: '', type: 'Special::NormalEfficacySpecial', efficacy_type: 1, target_type: 3,
  calc_option: 2, turn: 1, prob: 100, causality_conditions: null, eff_value1: 0, eff_value2: 0, eff_value3: 0,
});

export const INITIAL_ACTIVE_SKILL_EFFECT: () => ActiveSkillEffect = () => ({
    id: '', active_skill_set_id: '', target_type: 1, efficacy_type: 1, calc_option: 2,
    eff_val1: 0, eff_val2: 0, eff_val3: 0, efficacy_values: '{}',
    sub_target_type_set_id: null, thumb_effect_id: null, effect_se_id: null,
});

export const ID_PREFIXES = {
  CARD_UNIQUE_INFO: "70",
  PASSIVE_SKILL_SET: "71",
  LEADER_SKILL_SET: "72",
  ACTIVE_SKILL_SET: "73",
  SPECIAL_SET: "74",
  OPTIMAL_AWAKENING_GROWTH_ID: "75",
  OPTIMAL_AWAKENING_GROWTH_TYPE_ID: "76",
  // Add other prefixes as needed
} as const; // Use "as const" for stricter typing of prefix values

type PrefixValue = typeof ID_PREFIXES[keyof typeof ID_PREFIXES];
const ALL_PREFIX_VALUES = Object.values(ID_PREFIXES);

export const LOCAL_ID_START_RANGE = 1070000;
export const LOCAL_ID_END_RANGE = 7999999; // Allows for 1 million local base IDs
let localIdCounter = 0;

export const generateLocalId = (): DokkanID => {
  const newId = LOCAL_ID_START_RANGE + localIdCounter;
  if (newId > LOCAL_ID_END_RANGE) {
    console.warn("Local ID counter has exceeded the defined range. This may lead to issues.");
    // Potentially throw an error or reset, depending on desired behavior
  }
  localIdCounter++;
  return String(newId);
};

export const isLocallyGeneratedId = (id: DokkanID | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;

  const numId = Number(id);

  // Check if it's a base local ID (e.g., 7000001)
  if (!isNaN(numId) && numId >= LOCAL_ID_START_RANGE && numId <= LOCAL_ID_END_RANGE) {
    return true;
  }

  // Check if it's a derived prefixed ID (e.g., 707000001)
  for (const prefix of ALL_PREFIX_VALUES) {
    if (id.startsWith(prefix)) {
      const suffix = id.substring(prefix.length);
      if (suffix) {
        const suffixNum = Number(suffix);
        if (!isNaN(suffixNum) && suffixNum >= LOCAL_ID_START_RANGE && suffixNum <= LOCAL_ID_END_RANGE) {
          return true;
        }
      }
    }
  }
  return false;
};


export const INITIAL_CARD_SPECIAL = (card_id: DokkanID, defaultSpecialSetId?: DokkanID): CardSpecial => ({
  id: generateLocalId(),
  card_id: card_id,
  special_set_id: defaultSpecialSetId || '', 
  priority: 0,
  style: 'Normal',
  lv_start: 1,
  eball_num_start: 12,
  view_id: 0,
  card_costume_condition_id: 0,
  special_bonus_id1: 0,
  special_bonus_lv1: 0,
  bonus_view_id1: 0,
  special_bonus_id2: 0,
  special_bonus_lv2: 0,
  bonus_view_id2: 0,
  causality_conditions: null,
  special_asset_id: null,
});


export const DOKKAN_TABLE_COLUMNS: { [key:string]: string[]} = {
  cards: ["id", "name", "character_id", "card_unique_info_id", "cost", "rarity", "hp_init", "hp_max", "atk_init", "atk_max", "def_init", "def_max", "element", "lv_max", "skill_lv_max", "grow_type", "optimal_awakening_grow_type", "price", "exp_type", "training_exp", "special_motion", "passive_skill_set_id", "leader_skill_set_id", "link_skill1_id", "link_skill2_id", "link_skill3_id", "link_skill4_id", "link_skill5_id", "link_skill6_id", "link_skill7_id", "eball_mod_min", "eball_mod_num100", "eball_mod_mid", "eball_mod_mid_num", "eball_mod_max", "eball_mod_max_num", "max_level_reward_id", "max_level_reward_type", "collectable_type", "face_x", "face_y", "aura_id", "aura_scale", "aura_offset_x", "aura_offset_y", "is_aura_front", "is_selling_only", "awakening_number", "resource_id", "bg_effect_id", "selling_exchange_point", "awakening_element_type", "potential_board_id", "open_at", "created_at", "updated_at"],
  card_unique_infos: ["id", "name", "kana", "created_at", "updated_at"],
  card_card_categories: ["id", "card_id", "card_category_id", "num", "created_at", "updated_at"],
  leader_skill_sets: ["id", "name", "description", "created_at", "updated_at"],
  leader_skills: ["id", "leader_skill_set_id", "exec_timing_type", "target_type", "sub_target_type_set_id", "causality_conditions", "efficacy_type", "efficacy_values", "calc_option", "created_at", "updated_at"],
  passive_skill_sets: ["id", "name", "description", "itemized_description", "created_at", "updated_at"],
  passive_skills: ["id", "name", "description", "exec_timing_type", "efficacy_type", "target_type", "sub_target_type_set_id", "passive_skill_effect_id", "calc_option", "turn", "is_once", "probability", "causality_conditions", "eff_value1", "eff_value2", "eff_value3", "efficacy_values", "created_at", "updated_at"],
  passive_skill_set_relations: ["id", "passive_skill_set_id", "passive_skill_id", "created_at", "updated_at"],
  special_sets: ["id", "name", "description", "causality_description", "aim_target", "increase_rate", "lv_bonus", "is_inactive", "created_at", "updated_at"],
  specials: ["id", "special_set_id", "type", "efficacy_type", "target_type", "calc_option", "turn", "prob", "causality_conditions", "eff_value1", "eff_value2", "eff_value3", "created_at", "updated_at"],
  card_specials: ["id", "card_id", "special_set_id", "priority", "style", "lv_start", "eball_num_start", "view_id", "card_costume_condition_id", "special_bonus_id1", "special_bonus_lv1", "bonus_view_id1", "special_bonus_id2", "special_bonus_lv2", "bonus_view_id2", "causality_conditions", "special_asset_id", "created_at", "updated_at"],
  passive_skill_effects: ["id", "script_name", "lite_flicker_rate", "bgm_id", "created_at", "updated_at"],
  effect_packs: ["id", "category", "name", "pack_name", "scene_name", "red", "green", "blue", "alpha", "lite_flicker_rate", "created_at", "updated_at"],
  active_skill_sets: ["id", "name", "effect_description", "condition_description", "turn", "exec_limit", "causality_conditions", "ultimate_special_id", "special_view_id", "costume_special_view_id", "bgm_id", "created_at", "updated_at"],
  active_skills: ["id", "active_skill_set_id", "target_type", "sub_target_type_set_id", "calc_option", "efficacy_type", "eff_val1", "eff_val2", "eff_val3", "efficacy_values", "thumb_effect_id", "effect_se_id", "created_at", "updated_at"],
  card_active_skills: ["id", "card_id", "active_skill_set_id", "created_at", "updated_at"],
  optimal_awakening_growths: ["id", "growth_type_id", "val1_eza_marker", "val2_max_level", "val3_skill_lv_max", "passive_skill_set_id", "leader_skill_set_id"],
};
