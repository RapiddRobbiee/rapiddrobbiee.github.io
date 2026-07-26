import {
  ELEMENT_OPTIONS,
  RARITY_OPTIONS,
  applyCardRarityDefaults,
  clearPatchStateStorage,
  createCardBundle,
  createInitialPatchState,
  loadPatchState,
  parseCsvIds,
  savePatchState,
  toCsv,
} from "./dokkanModel.js";
import { generateSqlPatch } from "./sqlGenerator.js";

const addCardButton = document.getElementById("add-card");
const clearAllButton = document.getElementById("clear-all");
const cardList = document.getElementById("card-list");
const bundleCount = document.getElementById("bundle-count");
const selectedCardId = document.getElementById("selected-card-id");
const cardForm = document.getElementById("card-form");
const removeCardButton = document.getElementById("remove-card");
const sqlOutput = document.getElementById("sql-output");
const copySqlButton = document.getElementById("copy-sql");
const downloadSqlButton = document.getElementById("download-sql");
const status = document.getElementById("status");

let patchState = loadPatchState();
let selectedIndex = patchState.cardForms.length ? 0 : -1;

if (!patchState.cardForms.length) {
  patchState = createInitialPatchState();
  addCardBundle();
}

function setStatus(message) {
  status.textContent = message;
}

function getSelectedCard() {
  if (selectedIndex < 0 || selectedIndex >= patchState.cardForms.length) {
    return null;
  }
  return patchState.cardForms[selectedIndex];
}

function populateSelect(selectElement, options) {
  selectElement.innerHTML = "";
  options.forEach((entry) => {
    const option = document.createElement("option");
    option.value = String(entry.value);
    option.textContent = entry.label;
    selectElement.appendChild(option);
  });
}

function addCardBundle() {
  const bundle = createCardBundle();
  patchState.cardForms.push(bundle.cardForm);
  patchState.cardUniqueInfos.push(bundle.cardUniqueInfo);
  patchState.characters.push(bundle.character);
  patchState.passiveSkillSets.push(bundle.passiveSkillSet);
  patchState.leaderSkillSets.push(bundle.leaderSkillSet);
  patchState.specialSets.push(bundle.specialSet);
  patchState.activeSkillSets.push(bundle.activeSkillSet);
  patchState.standbySkillSets.push(bundle.standbySkillSet);
  patchState.cardSpecials.push(bundle.cardSpecial);
  patchState.cardActiveSkills.push(bundle.cardActiveSkill);
  patchState.cardStandbySkills.push(bundle.cardStandbySkill);

  selectedIndex = patchState.cardForms.length - 1;
  savePatchState(patchState);
  render();
  setStatus(`Added card bundle ${bundle.cardForm.id}.`);
}

function removeCardBundle(index) {
  if (index < 0 || index >= patchState.cardForms.length) {
    return;
  }
  const card = patchState.cardForms[index];
  const cardId = card.id;

  patchState.cardForms.splice(index, 1);
  patchState.cardUniqueInfos = patchState.cardUniqueInfos.filter((row) => row.id !== card.card_unique_info_id);
  patchState.characters = patchState.characters.filter((row) => row.id !== card.character_id);
  patchState.passiveSkillSets = patchState.passiveSkillSets.filter((row) => row.id !== card.passive_skill_set_id);
  patchState.leaderSkillSets = patchState.leaderSkillSets.filter((row) => row.id !== card.leader_skill_set_id);
  patchState.specialSets = patchState.specialSets.filter((row) => row.id !== cardId);
  patchState.activeSkillSets = patchState.activeSkillSets.filter((row) => row.id !== card.active_skill_set_id_ref);
  patchState.standbySkillSets = patchState.standbySkillSets.filter((row) => row.id !== card.standby_skill_set_id_ref);
  patchState.cardSpecials = patchState.cardSpecials.filter((row) => row.card_id !== cardId);
  patchState.cardActiveSkills = patchState.cardActiveSkills.filter((row) => row.card_id !== cardId);
  patchState.cardStandbySkills = patchState.cardStandbySkills.filter((row) => row.card_id !== cardId);

  if (!patchState.cardForms.length) {
    selectedIndex = -1;
    addCardBundle();
    return;
  }

  selectedIndex = Math.max(0, Math.min(selectedIndex, patchState.cardForms.length - 1));
  savePatchState(patchState);
  render();
  setStatus(`Removed card bundle ${cardId}.`);
}

function syncRelatedRows(card) {
  const unique = patchState.cardUniqueInfos.find((row) => row.id === card.card_unique_info_id);
  if (unique) {
    unique.name = cardForm.elements.characterName.value.trim() || unique.name;
  }

  const character = patchState.characters.find((row) => row.id === card.character_id);
  if (character) {
    character.name = cardForm.elements.characterName.value.trim() || character.name;
  }
}

function writeFormFromSelectedCard() {
  const card = getSelectedCard();
  if (!card) {
    cardForm.reset();
    selectedCardId.textContent = "No card selected";
    return;
  }

  selectedCardId.textContent = `Card ID: ${card.id}`;
  const character = patchState.characters.find((row) => row.id === card.character_id);

  cardForm.elements.name.value = card.name;
  cardForm.elements.characterName.value = character?.name || "";
  cardForm.elements.rarity.value = String(card.rarity);
  cardForm.elements.element.value = String(card.element);
  cardForm.elements.cost.value = String(card.cost);
  cardForm.elements.hp_init.value = String(card.hp_init);
  cardForm.elements.hp_max.value = String(card.hp_max);
  cardForm.elements.atk_init.value = String(card.atk_init);
  cardForm.elements.atk_max.value = String(card.atk_max);
  cardForm.elements.def_init.value = String(card.def_init);
  cardForm.elements.def_max.value = String(card.def_max);
  cardForm.elements.lv_max.value = String(card.lv_max);
  cardForm.elements.skill_lv_max.value = String(card.skill_lv_max);
  cardForm.elements.character_id.value = String(card.character_id || "");
  cardForm.elements.category_ids.value = toCsv(card.category_ids);
  cardForm.elements.link_skill_ids.value = toCsv(card.link_skill_ids);
}

function renderCardList() {
  bundleCount.textContent = `${patchState.cardForms.length} cards`;

  if (!patchState.cardForms.length) {
    cardList.innerHTML = "<div class=\"muted\">No card bundles yet.</div>";
    return;
  }

  cardList.innerHTML = "";
  patchState.cardForms.forEach((card, index) => {
    const item = document.createElement("article");
    item.className = `card-item${index === selectedIndex ? " active" : ""}`;
    item.dataset.index = String(index);
    const nameEl = document.createElement("strong");
    nameEl.textContent = card.name || "(unnamed card)";
    const metaEl = document.createElement("span");
    metaEl.className = "muted";
    metaEl.textContent = `ID ${card.id} | rarity ${card.rarity} | element ${card.element}`;
    const statsEl = document.createElement("small");
    statsEl.className = "muted";
    statsEl.textContent = `HP ${card.hp_max} | ATK ${card.atk_max} | DEF ${card.def_max}`;
    item.append(nameEl, document.createElement("br"), metaEl, document.createElement("br"), statsEl);
    cardList.appendChild(item);
  });
}

function renderSql() {
  sqlOutput.textContent = generateSqlPatch(patchState);
}

function render() {
  renderCardList();
  writeFormFromSelectedCard();
  renderSql();
}

cardList.addEventListener("click", (event) => {
  const item = event.target.closest(".card-item");
  if (!item) {
    return;
  }
  selectedIndex = Number.parseInt(item.dataset.index || "-1", 10);
  render();
  setStatus(`Selected card index ${selectedIndex + 1}.`);
});

addCardButton.addEventListener("click", () => {
  addCardBundle();
});

clearAllButton.addEventListener("click", () => {
  patchState = createInitialPatchState();
  clearPatchStateStorage();
  selectedIndex = -1;
  addCardBundle();
  setStatus("Reset all bundles and local saved state.");
});

removeCardButton.addEventListener("click", () => {
  removeCardBundle(selectedIndex);
});

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const card = getSelectedCard();
  if (!card) {
    return;
  }

  card.name = cardForm.elements.name.value.trim();
  card.character_id = cardForm.elements.character_id.value.trim() || card.character_id;
  card.rarity = Number.parseInt(cardForm.elements.rarity.value, 10) || 4;
  card.element = Number.parseInt(cardForm.elements.element.value, 10) || 0;
  card.cost = Number.parseInt(cardForm.elements.cost.value, 10) || 0;
  card.hp_init = Number.parseInt(cardForm.elements.hp_init.value, 10) || 0;
  card.hp_max = Number.parseInt(cardForm.elements.hp_max.value, 10) || 0;
  card.atk_init = Number.parseInt(cardForm.elements.atk_init.value, 10) || 0;
  card.atk_max = Number.parseInt(cardForm.elements.atk_max.value, 10) || 0;
  card.def_init = Number.parseInt(cardForm.elements.def_init.value, 10) || 0;
  card.def_max = Number.parseInt(cardForm.elements.def_max.value, 10) || 0;
  card.lv_max = Number.parseInt(cardForm.elements.lv_max.value, 10) || card.lv_max;
  card.skill_lv_max = Number.parseInt(cardForm.elements.skill_lv_max.value, 10) || card.skill_lv_max;
  card.category_ids = parseCsvIds(cardForm.elements.category_ids.value);
  card.link_skill_ids = parseCsvIds(cardForm.elements.link_skill_ids.value).slice(0, 7);
  while (card.link_skill_ids.length < 7) {
    card.link_skill_ids.push("");
  }

  const rarityAdjusted = applyCardRarityDefaults(card);
  Object.assign(card, rarityAdjusted);
  syncRelatedRows(card);

  savePatchState(patchState);
  render();
  setStatus(`Saved changes for card ${card.id}.`);
});

copySqlButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sqlOutput.textContent || "");
    setStatus("Copied SQL to clipboard.");
  } catch (error) {
    console.error(error);
    setStatus("Copy failed. Clipboard permission might be blocked.");
  }
});

downloadSqlButton.addEventListener("click", () => {
  const blob = new Blob([sqlOutput.textContent || ""], { type: "text/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `dokkan_patch_${date}.sql`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Downloaded SQL file.");
});

populateSelect(cardForm.elements.rarity, RARITY_OPTIONS);
populateSelect(cardForm.elements.element, ELEMENT_OPTIONS);
render();
