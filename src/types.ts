export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  cuisine: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string[];
  mealTypes: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snack')[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: GroceryCategory;
}

export type GroceryCategory = 
  | 'Produce' 
  | 'Dairy & Eggs' 
  | 'Meat & Seafood' 
  | 'Pantry' 
  | 'Frozen' 
  | 'Bakery' 
  | 'Beverages' 
  | 'Other';

export interface MealSlot {
  id: string;
  day: string;
  mealType: 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Afternoon Snack' | 'Dinner';
  recipe?: Recipe;
  servings?: number;
}

export interface MealPlan {
  id: string;
  name: string;
  week: string;
  meals: MealSlot[];
  createdAt: Date;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: GroceryCategory;
  completed: boolean;
  recipeNames: string[];
}

export interface CustomRecipe extends Recipe {
}