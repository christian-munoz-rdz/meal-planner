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

export const exportMealPlanCSV = (meals: MealSlot[]): void => {
  // Create CSV content in normalized format
  const csvRows = ['Día,Tiempo,Ingrediente,Porción'];
  
  // Day mapping for consistent output
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Meal type mapping
  const mealTypeMapping: { [key: string]: string } = {
    'Breakfast': 'Breakfast',
    'Morning Snack': 'Snack M',
    'Lunch': 'Lunch',
    'Afternoon Snack': 'Snack V',
    'Dinner': 'Dinner'
  };

  // Process meals in day order
  dayOrder.forEach(day => {
    const dayMeals = meals.filter(meal => meal.day === day && meal.recipe);
    
    dayMeals.forEach(meal => {
      if (!meal.recipe) return;
      
      const mealTime = mealTypeMapping[meal.mealType] || meal.mealType;
      const servingMultiplier = (meal.servings || meal.recipe.servings) / meal.recipe.servings;
      
      meal.recipe.ingredients.forEach(ingredient => {
        const adjustedAmount = ingredient.amount * servingMultiplier;
        let portion = '';
        
        if (adjustedAmount === 0 || !adjustedAmount) {
          portion = 'nan';
        } else {
          // Format the portion
          const formattedAmount = adjustedAmount % 1 === 0 ? 
            adjustedAmount.toString() : 
            adjustedAmount.toFixed(2).replace(/\.?0+$/, '');
          portion = `${formattedAmount}${ingredient.unit}`;
        }
        
        // Escape ingredient name if it contains commas
        const ingredientName = ingredient.name.includes(',') ? 
          `"${ingredient.name}"` : 
          ingredient.name;
        
        csvRows.push(`${day},${mealTime},${ingredientName},${portion}`);
      });
    });
  });
  
  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'meal-plan-normalized.csv';
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