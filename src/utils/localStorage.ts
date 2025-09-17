import { MealPlan, ShoppingListItem } from '../types';

const MEAL_PLANS_KEY = 'mealPlans';
const SHOPPING_LIST_KEY = 'shoppingList';
const CUSTOM_RECIPES_KEY = 'customRecipes';
const CURRENT_MEALS_KEY = 'currentMeals';

export const saveMealPlans = (mealPlans: MealPlan[]): void => {
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
};

export const loadMealPlans = (): MealPlan[] => {
  const stored = localStorage.getItem(MEAL_PLANS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveShoppingList = (shoppingList: ShoppingListItem[]): void => {
  localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList));
};

export const loadShoppingList = (): ShoppingListItem[] => {
  const stored = localStorage.getItem(SHOPPING_LIST_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const exportMealPlan = (mealPlan: MealPlan): void => {
  const dataStr = JSON.stringify(mealPlan, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `meal-plan-${mealPlan.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportShoppingList = (shoppingList: ShoppingListItem[]): void => {
  const listText = shoppingList
    .map(item => `${item.completed ? '✓' : '○'} ${item.amount} ${item.unit} ${item.name}`)
    .join('\n');
  
  const dataBlob = new Blob([listText], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'shopping-list.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const saveCustomRecipes = (recipes: Recipe[]): void => {
  localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
};

export const loadCustomRecipes = (): Recipe[] => {
  const stored = localStorage.getItem(CUSTOM_RECIPES_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveCurrentMeals = (meals: MealSlot[]): void => {
  localStorage.setItem(CURRENT_MEALS_KEY, JSON.stringify(meals));
};

export const loadCurrentMeals = (): MealSlot[] => {
  const stored = localStorage.getItem(CURRENT_MEALS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}