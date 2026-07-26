import { PlannerTemplate, CardFormTemplate, PlannedCard } from '../types';
import { generateLocalId } from '../constants';

const PLANNER_TEMPLATES_KEY = 'dokkanPlannerTemplates';
const CARDFORM_TEMPLATES_KEY = 'dokkanCardFormTemplates';

// ── Planner Templates ──

export const getPlannerTemplates = (): PlannerTemplate[] => {
  try {
    const raw = localStorage.getItem(PLANNER_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const savePlannerTemplate = (
  card: PlannedCard,
  name: string,
  description?: string
): PlannerTemplate => {
  const templates = getPlannerTemplates();
  const existing = templates.find((t) => t.name === name);
  const now = Date.now();

  const { plannerCardId, ...cardData } = card;

  const template: PlannerTemplate = {
    id: existing?.id || generateLocalId(),
    name,
    description,
    card: cardData,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const updated = existing
    ? templates.map((t) => (t.name === name ? template : t))
    : [...templates, template];

  localStorage.setItem(PLANNER_TEMPLATES_KEY, JSON.stringify(updated));
  return template;
};

export const deletePlannerTemplate = (id: string): void => {
  const templates = getPlannerTemplates().filter((t) => t.id !== id);
  localStorage.setItem(PLANNER_TEMPLATES_KEY, JSON.stringify(templates));
};

export const applyPlannerTemplate = (template: PlannerTemplate): Omit<PlannedCard, 'plannerCardId'> => {
  return JSON.parse(JSON.stringify(template.card));
};

// ── Card Form Templates ──

export const getCardFormTemplates = (): CardFormTemplate[] => {
  try {
    const raw = localStorage.getItem(CARDFORM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCardFormTemplate = (
  cardFormData: any,
  name: string,
  description?: string
): CardFormTemplate => {
  const templates = getCardFormTemplates();
  const existing = templates.find((t) => t.name === name);
  const now = Date.now();

  const template: CardFormTemplate = {
    id: existing?.id || generateLocalId(),
    name,
    description,
    cardForm: cardFormData,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  const updated = existing
    ? templates.map((t) => (t.name === name ? template : t))
    : [...templates, template];

  localStorage.setItem(CARDFORM_TEMPLATES_KEY, JSON.stringify(updated));
  return template;
};

export const deleteCardFormTemplate = (id: string): void => {
  const templates = getCardFormTemplates().filter((t) => t.id !== id);
  localStorage.setItem(CARDFORM_TEMPLATES_KEY, JSON.stringify(templates));
};
