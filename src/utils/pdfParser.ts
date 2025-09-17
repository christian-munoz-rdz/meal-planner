import { GlobalWorkerOptions } from 'pdfjs-dist';
import { Recipe, MealSlot, Ingredient } from '../types';

// PDF parsing utility (using pdf-parse in browser environment)
export const parsePDFMealPlan = async (file: File): Promise<{ meals: MealSlot[], recipes: Recipe[] }> => {
  try {
    // Configure PDF.js worker
    GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.js`;
    
    // For browser environment, we'll use FileReader to read the PDF
    const arrayBuffer = await file.arrayBuffer();
    
    // Import pdf-parse dynamically for browser compatibility
    const pdfParse = await import('pdf-parse/lib/pdf-parse');
    const data = await pdfParse.default(arrayBuffer);
    
    return parseMealPlanText(data.text);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF. Please ensure it\'s a valid PDF file.');
  }
};

// Parse the extracted text from PDF
const parseMealPlanText = (text: string): { meals: MealSlot[], recipes: Recipe[] } => {
  const meals: MealSlot[] = [];
  const recipes: Recipe[] = [];
  const recipeMap = new Map<string, Recipe>();

  // Spanish to English day mapping
  const dayMapping: { [key: string]: string } = {
    'domingo': 'Sunday',
    'lunes': 'Monday', 
    'martes': 'Tuesday',
    'miércoles': 'Wednesday',
    'miercoles': 'Wednesday',
    'jueves': 'Thursday',
    'viernes': 'Friday',
    'sábado': 'Saturday',
    'sabado': 'Saturday'
  };

  // Spanish to English meal type mapping
  const mealTypeMapping: { [key: string]: string } = {
    'desayuno': 'Breakfast',
    'colación m': 'Morning Snack',
    'colacion m': 'Morning Snack',
    'comida': 'Lunch',
    'colación v': 'Afternoon Snack',
    'colacion v': 'Afternoon Snack',
    'cena': 'Dinner'
  };

  // Split text into lines and process
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentDay = '';
  let currentMealType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if line contains a day
    const dayFound = Object.keys(dayMapping).find(spanishDay => 
      line.includes(spanishDay)
    );
    
    if (dayFound) {
      currentDay = dayMapping[dayFound];
      continue;
    }
    
    // Check if line contains meal type indicators
    const mealTypeFound = Object.keys(mealTypeMapping).find(spanishMeal => 
      line.includes(spanishMeal)
    );
    
    if (mealTypeFound) {
      currentMealType = mealTypeMapping[mealTypeFound];
      continue;
    }
    
    // If we have both day and meal type, and the line contains food descriptions
    if (currentDay && currentMealType && line.length > 10) {
      // Skip lines that are just "opcional"
      if (line === 'opcional') continue;
      
      // Extract recipe information from the line
      const recipeData = extractRecipeFromText(lines[i]);
      
      if (recipeData) {
        const recipeId = `imported-${Date.now()}-${Math.random()}`;
        const recipe: Recipe = {
          id: recipeId,
          name: recipeData.name,
          description: recipeData.description,
          cookTime: 30, // Default cook time
          servings: 1, // Default servings
          difficulty: 'Medium' as const,
          category: getMealCategory(currentMealType),
          cuisine: 'Mexican', // Based on the Spanish content
          image: '',
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          }
        };
        
        // Add recipe to map to avoid duplicates
        const recipeKey = `${recipe.name}-${recipe.description}`;
        if (!recipeMap.has(recipeKey)) {
          recipeMap.set(recipeKey, recipe);
          recipes.push(recipe);
        }
        
        // Create meal slot
        const mealSlot: MealSlot = {
          id: `${currentDay}-${currentMealType}`,
          day: currentDay,
          mealType: currentMealType as any,
          recipe: recipe,
          servings: 1
        };
        
        meals.push(mealSlot);
      }
    }
  }
  
  return { meals, recipes };
};

// Extract recipe information from text line
const extractRecipeFromText = (text: string): {
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
} | null => {
  if (!text || text.length < 5) return null;
  
  // Clean the text
  const cleanText = text.trim();
  
  // Extract ingredients and quantities using regex patterns
  const ingredients: Ingredient[] = [];
  const ingredientPatterns = [
    /(\d+(?:\.\d+)?)\s*(g|gr|gramos?|kg|kilogramos?)\s+de\s+([^,\.]+)/gi,
    /(\d+(?:\.\d+)?)\s*(ml|litros?|l)\s+de\s+([^,\.]+)/gi,
    /(\d+(?:\.\d+)?)\s*(taza|tazas|cdta|cucharadita|cda|cucharada)\s+de\s+([^,\.]+)/gi,
    /(\d+(?:\.\d+)?)\s*(pza|pieza|piezas|lata|latas)\s+de\s+([^,\.]+)/gi
  ];
  
  let ingredientText = cleanText;
  
  ingredientPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanText)) !== null) {
      const amount = parseFloat(match[1]);
      const unit = normalizeUnit(match[2]);
      const name = match[3].trim();
      
      ingredients.push({
        id: `ingredient-${Date.now()}-${Math.random()}`,
        name: name,
        amount: amount,
        unit: unit,
        category: categorizeIngredient(name)
      });
      
      // Remove this ingredient from the text for recipe name extraction
      ingredientText = ingredientText.replace(match[0], '');
    }
  });
  
  // Generate recipe name from the first few words or main ingredient
  let recipeName = '';
  if (ingredients.length > 0) {
    recipeName = `${ingredients[0].name} recipe`;
  } else {
    // Extract first meaningful words
    const words = cleanText.split(' ').filter(word => word.length > 2);
    recipeName = words.slice(0, 3).join(' ');
  }
  
  // Capitalize first letter
  recipeName = recipeName.charAt(0).toUpperCase() + recipeName.slice(1);
  
  // Create basic instructions
  const instructions = [
    'Prepare all ingredients as listed',
    'Follow traditional cooking methods for this dish',
    'Cook until done and serve hot'
  ];
  
  return {
    name: recipeName,
    description: cleanText,
    ingredients: ingredients,
    instructions: instructions
  };
};

// Normalize units to English
const normalizeUnit = (unit: string): string => {
  const unitMap: { [key: string]: string } = {
    'g': 'g',
    'gr': 'g', 
    'gramos': 'g',
    'gramo': 'g',
    'kg': 'kg',
    'kilogramos': 'kg',
    'kilogramo': 'kg',
    'ml': 'ml',
    'l': 'l',
    'litros': 'l',
    'litro': 'l',
    'taza': 'cup',
    'tazas': 'cup',
    'cdta': 'tsp',
    'cucharadita': 'tsp',
    'cda': 'tbsp',
    'cucharada': 'tbsp',
    'pza': 'piece',
    'pieza': 'piece',
    'piezas': 'piece',
    'lata': 'can',
    'latas': 'can'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
};

// Categorize ingredients
const categorizeIngredient = (name: string): any => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('pollo') || lowerName.includes('res') || lowerName.includes('pescado') || 
      lowerName.includes('carne') || lowerName.includes('atún') || lowerName.includes('salmón')) {
    return 'Meat & Seafood';
  }
  
  if (lowerName.includes('huevo') || lowerName.includes('leche') || lowerName.includes('queso') ||
      lowerName.includes('yogurt') || lowerName.includes('crema')) {
    return 'Dairy & Eggs';
  }
  
  if (lowerName.includes('tomate') || lowerName.includes('cebolla') || lowerName.includes('lechuga') ||
      lowerName.includes('espinaca') || lowerName.includes('apio') || lowerName.includes('pepino') ||
      lowerName.includes('zanahoria') || lowerName.includes('jitomate')) {
    return 'Produce';
  }
  
  if (lowerName.includes('pan') || lowerName.includes('tortilla') || lowerName.includes('tostada')) {
    return 'Bakery';
  }
  
  if (lowerName.includes('aceite') || lowerName.includes('sal') || lowerName.includes('pimienta') ||
      lowerName.includes('avena') || lowerName.includes('arroz') || lowerName.includes('frijol')) {
    return 'Pantry';
  }
  
  return 'Other';
};

// Get meal category based on meal type
const getMealCategory = (mealType: string): any => {
  switch (mealType) {
    case 'Breakfast':
      return 'Breakfast';
    case 'Lunch':
      return 'Lunch';
    case 'Dinner':
      return 'Dinner';
    case 'Morning Snack':
    case 'Afternoon Snack':
      return 'Snack';
    default:
      return 'Dinner';
  }
};