import { MealSlot, Recipe, Ingredient, ShoppingListItem, GroceryCategory } from '../types';

export const generateShoppingList = (meals: MealSlot[]): ShoppingListItem[] => {
  const ingredientMap = new Map<string, ShoppingListItem>();

  meals.forEach(meal => {
    if (!meal.recipe) return;
    
    const servingMultiplier = (meal.servings || meal.recipe.servings) / meal.recipe.servings;
    
    meal.recipe.ingredients.forEach(ingredient => {
      const key = `${ingredient.name}-${ingredient.unit}`;
      const adjustedAmount = ingredient.amount * servingMultiplier;
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.amount += adjustedAmount;
        if (!existing.recipeNames.includes(meal.recipe!.name)) {
          existing.recipeNames.push(meal.recipe!.name);
        }
      } else {
        ingredientMap.set(key, {
          id: `${ingredient.id}-${Math.random()}`,
          name: ingredient.name,
          amount: adjustedAmount,
          unit: ingredient.unit,
          category: ingredient.category,
          completed: false,
          recipeNames: [meal.recipe.name]
        });
      }
    });
  });

  return Array.from(ingredientMap.values()).sort((a, b) => {
    const categoryOrder: GroceryCategory[] = [
      'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 
      'Frozen', 'Pantry', 'Beverages', 'Other'
    ];
    
    const aCategoryIndex = categoryOrder.indexOf(a.category);
    const bCategoryIndex = categoryOrder.indexOf(b.category);
    
    if (aCategoryIndex !== bCategoryIndex) {
      return aCategoryIndex - bCategoryIndex;
    }
    
    return a.name.localeCompare(b.name);
  });
};

export const getDaysOfWeek = (): string[] => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
};

export const getMealTypes = (): string[] => {
  return ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner'];
};

export const calculateTotalNutrition = (meals: MealSlot[]) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  
  meals.forEach(meal => {
    if (meal.recipe) {
      const multiplier = (meal.servings || meal.recipe.servings) / meal.recipe.servings;
      totals.calories += meal.recipe.nutrition.calories * multiplier;
      totals.protein += meal.recipe.nutrition.protein * multiplier;
      totals.carbs += meal.recipe.nutrition.carbs * multiplier;
      totals.fat += meal.recipe.nutrition.fat * multiplier;
      totals.fiber += meal.recipe.nutrition.fiber * multiplier;
    }
  });
  
  return totals;
};