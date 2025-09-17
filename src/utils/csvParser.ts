import { Recipe, MealSlot, Ingredient } from '../types';

// CSV parsing utility for meal plan data
export const parseCSVMealPlan = async (file: File): Promise<{ meals: MealSlot[], recipes: Recipe[] }> => {
  try {
    const text = await file.text();
    return parseMealPlanCSV(text);
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV file. Please ensure it\'s a valid CSV file with the correct format.');
  }
};

// Parse the CSV text content
const parseMealPlanCSV = (csvText: string): { meals: MealSlot[], recipes: Recipe[] } => {
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

  // Parse CSV content
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row.');
  }

  // Parse header to get meal type columns
  const header = parseCSVRow(lines[0]);
  const mealTypeColumns: { [key: number]: string } = {};
  
  header.forEach((col, index) => {
    const normalizedCol = col.toLowerCase().trim();
    if (mealTypeMapping[normalizedCol]) {
      mealTypeColumns[index] = mealTypeMapping[normalizedCol];
    }
  });

  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    
    if (row.length === 0) continue;
    
    // First column should be the day
    const daySpanish = row[0]?.toLowerCase().trim();
    const dayEnglish = dayMapping[daySpanish];
    
    if (!dayEnglish) continue;

    // Process each meal type column
    Object.entries(mealTypeColumns).forEach(([colIndex, mealType]) => {
      const colIdx = parseInt(colIndex);
      const mealDescription = row[colIdx]?.trim();
      
      if (!mealDescription || mealDescription.toLowerCase() === 'opcional') return;

      // Extract recipe information from the meal description
      const recipeData = extractRecipeFromText(mealDescription);
      
      if (recipeData) {
        const recipeId = `imported-csv-${Date.now()}-${Math.random()}`;
        const recipe: Recipe = {
          id: recipeId,
          name: recipeData.name,
          description: recipeData.description,
          cookTime: 30,
          servings: 1,
          difficulty: 'Medium' as const,
          category: getMealCategory(mealType),
          cuisine: 'Mexican',
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
          id: `${dayEnglish}-${mealType}`,
          day: dayEnglish,
          mealType: mealType as any,
          recipe: recipe,
          servings: 1
        };
        
        meals.push(mealSlot);
      }
    });
  }
  
  return { meals, recipes };
};

// Parse a single CSV row, handling quoted fields with commas and newlines
const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

// Extract recipe information from text description
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
    /(\d+(?:\.\d+)?)\s*(g|gr|gramos?|kg|kilogramos?)\s+de\s+([^,\.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(ml|litros?|l)\s+de\s+([^,\.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(tza|tazas|cdta|cucharadita|cda|cucharada|ctda|ctdita)\s+de\s+([^,\.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(pza|pieza|piezas|lata|latas|rbn|rebanada|rebanadas)\s+de\s+([^,\.\n]+)/gi,
    /(\d+(?:\.\d+)?)\s*(mitades?)\s+de\s+([^,\.\n]+)/gi
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
    // Use the first ingredient as base for recipe name
    const mainIngredient = ingredients[0].name;
    recipeName = `${mainIngredient}`;
  } else {
    // Extract first meaningful words
    const words = cleanText.split(/[\s,\.]+/).filter(word => word.length > 2);
    recipeName = words.slice(0, 3).join(' ');
  }
  
  // Capitalize first letter and clean up
  recipeName = recipeName.charAt(0).toUpperCase() + recipeName.slice(1);
  recipeName = recipeName.replace(/\s+/g, ' ').trim();
  
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
    'tza': 'cup',
    'tazas': 'cup',
    'cdta': 'tsp',
    'cucharadita': 'tsp',
    'cda': 'tbsp',
    'cucharada': 'tbsp',
    'ctda': 'tbsp',
    'ctdita': 'tsp',
    'pza': 'piece',
    'pieza': 'piece',
    'piezas': 'piece',
    'lata': 'can',
    'latas': 'can',
    'rbn': 'slice',
    'rebanada': 'slice',
    'rebanadas': 'slice',
    'mitad': 'half',
    'mitades': 'half'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
};

// Categorize ingredients
const categorizeIngredient = (name: string): any => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('pollo') || lowerName.includes('res') || lowerName.includes('pescado') || 
      lowerName.includes('carne') || lowerName.includes('atún') || lowerName.includes('salmón') ||
      lowerName.includes('pavo') || lowerName.includes('molida') || lowerName.includes('filete') ||
      lowerName.includes('falda') || lowerName.includes('pechuga')) {
    return 'Meat & Seafood';
  }
  
  if (lowerName.includes('huevo') || lowerName.includes('leche') || lowerName.includes('queso') ||
      lowerName.includes('yogurt') || lowerName.includes('crema') || lowerName.includes('panela')) {
    return 'Dairy & Eggs';
  }
  
  if (lowerName.includes('tomate') || lowerName.includes('cebolla') || lowerName.includes('lechuga') ||
      lowerName.includes('espinaca') || lowerName.includes('apio') || lowerName.includes('pepino') ||
      lowerName.includes('zanahoria') || lowerName.includes('jitomate') || lowerName.includes('nopales') ||
      lowerName.includes('calabacitas') || lowerName.includes('chayote') || lowerName.includes('jicama') ||
      lowerName.includes('perejil') || lowerName.includes('manzana') || lowerName.includes('piña') ||
      lowerName.includes('naranja') || lowerName.includes('fresa') || lowerName.includes('papaya') ||
      lowerName.includes('melón') || lowerName.includes('almendras') || lowerName.includes('nuez') ||
      lowerName.includes('cacahuate')) {
    return 'Produce';
  }
  
  if (lowerName.includes('pan') || lowerName.includes('tortilla') || lowerName.includes('tostada')) {
    return 'Bakery';
  }
  
  if (lowerName.includes('aceite') || lowerName.includes('sal') || lowerName.includes('pimienta') ||
      lowerName.includes('avena') || lowerName.includes('arroz') || lowerName.includes('frijol') ||
      lowerName.includes('lentejas') || lowerName.includes('mayonesa') || lowerName.includes('canela') ||
      lowerName.includes('limón') || lowerName.includes('salsa')) {
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