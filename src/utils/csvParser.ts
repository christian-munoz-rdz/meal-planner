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

  // Spanish to English day mapping
  const dayMapping: { [key: string]: string } = {
    'domingo': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday', 
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
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
    'breakfast': 'Breakfast',
    'snack m': 'Morning Snack',
    'lunch': 'Lunch', 
    'snack v': 'Afternoon Snack',
    'dinner': 'Dinner',
    'desayuno': 'Breakfast',
    'colación m': 'Morning Snack',
    'colacion m': 'Morning Snack',
    'comida': 'Lunch',
    'colación v': 'Afternoon Snack',
    'colacion v': 'Afternoon Snack',
    'cena': 'Dinner'
  };

  // Parse CSV content - normalized format
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row.');
  }

  // Parse header - expect: Día, Tiempo, Ingrediente, Porción
  const header = parseCSVRow(lines[0]);
  const expectedHeaders = ['día', 'tiempo', 'ingrediente', 'porción'];
  const normalizedHeader = header.map(h => h.toLowerCase().trim());
  
  // Validate header format
  if (!expectedHeaders.every(expected => normalizedHeader.includes(expected))) {
    throw new Error('CSV must have columns: Día, Tiempo, Ingrediente, Porción');
  }

  // Get column indices
  const dayIndex = normalizedHeader.indexOf('día');
  const timeIndex = normalizedHeader.indexOf('tiempo');
  const ingredientIndex = normalizedHeader.indexOf('ingrediente');
  const portionIndex = normalizedHeader.indexOf('porción');

  // Group ingredients by day and meal type
  const mealGroups: { [key: string]: { [key: string]: Ingredient[] } } = {};

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    
    if (row.length === 0) continue;
    
    const daySpanish = row[dayIndex]?.toLowerCase().trim();
    const mealTypeSpanish = row[timeIndex]?.toLowerCase().trim();
    const ingredientName = row[ingredientIndex]?.trim();
    const portion = row[portionIndex]?.trim();
    
    const dayEnglish = dayMapping[daySpanish];
    const mealTypeEnglish = mealTypeMapping[mealTypeSpanish];
    
    if (!dayEnglish || !mealTypeEnglish || !ingredientName) continue;
    
    // Skip ingredients with 'nan' portion or empty values
    if (!portion || portion.toLowerCase() === 'nan') continue;

    // Parse portion to get amount and unit
    const { amount, unit } = parsePortion(portion);
    
    // Create ingredient
    const ingredient: Ingredient = {
      id: `ingredient-${Date.now()}-${Math.random()}`,
      name: ingredientName,
      amount: amount,
      unit: unit,
      category: categorizeIngredient(ingredientName)
    };

    // Group ingredients by day and meal type
    const mealKey = `${dayEnglish}-${mealTypeEnglish}`;
    if (!mealGroups[dayEnglish]) {
      mealGroups[dayEnglish] = {};
    }
    if (!mealGroups[dayEnglish][mealTypeEnglish]) {
      mealGroups[dayEnglish][mealTypeEnglish] = [];
    }
    mealGroups[dayEnglish][mealTypeEnglish].push(ingredient);
  }

  // Create recipes and meals from grouped ingredients
  Object.entries(mealGroups).forEach(([day, mealTypes]) => {
    Object.entries(mealTypes).forEach(([mealType, ingredients]) => {
      if (ingredients.length === 0) return;

      // Generate recipe name from main ingredients
      const mainIngredients = ingredients.slice(0, 2).map(ing => ing.name);
      const recipeName = mainIngredients.join(' and ');
      
      // Create recipe description from ingredients
      const description = ingredients.map(ing => 
        `${ing.amount} ${ing.unit} ${ing.name}`
      ).join(', ');

      const recipeId = `imported-csv-${Date.now()}-${Math.random()}`;
      const recipe: Recipe = {
        id: recipeId,
        name: recipeName.charAt(0).toUpperCase() + recipeName.slice(1),
        description: description,
        cookTime: 30,
        servings: 1,
        difficulty: 'Medium' as const,
        category: getMealCategory(mealType),
        cuisine: 'Mexican',
        image: '',
        ingredients: ingredients,
        instructions: [
          'Prepare all ingredients as listed',
          'Follow traditional cooking methods for this dish',
          'Cook until done and serve hot'
        ],
        mealTypes: [getMealCategory(mealType)],
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        }
      };
      
      recipes.push(recipe);
      
      // Create meal slot
      const mealSlot: MealSlot = {
        id: `${day}-${mealType}`,
        day: day,
        mealType: mealType as any,
        recipe: recipe,
        servings: 1
      };
      
      meals.push(mealSlot);
    });
  });
  
  return { meals, recipes };
};

// Parse portion string to extract amount and unit
const parsePortion = (portion: string): { amount: number; unit: string } => {
  if (!portion || portion.toLowerCase() === 'nan') {
    return { amount: 1, unit: 'piece' };
  }

  // Try to extract number and unit from portion
  const match = portion.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(.*)$/);
  
  if (match) {
    let amount = parseFloat(match[1]);
    
    // Handle fractions like 1/2
    if (match[1].includes('/')) {
      const [num, den] = match[1].split('/');
      amount = parseFloat(num) / parseFloat(den);
    }
    
    const unit = normalizeUnit(match[2].trim() || 'piece');
    return { amount, unit };
  }
  
  // If no number found, assume 1 piece
  return { amount: 1, unit: normalizeUnit(portion) };
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
    'lata': 'can',
    'latas': 'can',
    'mitad': 'half',
    'mitades': 'half',
    '': 'piece'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
};

// Categorize ingredients
const categorizeIngredient = (name: string): any => {
  const lowerName = name.toLowerCase();
  
  // Meat & Seafood
  if (lowerName.includes('pollo') || lowerName.includes('res') || lowerName.includes('pescado') || 
      lowerName.includes('carne') || lowerName.includes('atún') || lowerName.includes('atun') ||
      lowerName.includes('salmón') || lowerName.includes('pavo') || lowerName.includes('molida') || 
      lowerName.includes('filete') || lowerName.includes('falda') || lowerName.includes('pechuga') ||
      lowerName.includes('bistec') || lowerName.includes('jamon') || lowerName.includes('jamón')) {
    return 'Meat & Seafood';
  }
  
  // Dairy & Eggs
  if (lowerName.includes('huevo') || lowerName.includes('leche') || lowerName.includes('queso') ||
      lowerName.includes('yogurt') || lowerName.includes('crema') || lowerName.includes('panela')) {
    return 'Dairy & Eggs';
  }
  
  // Produce
  if (lowerName.includes('tomate') || lowerName.includes('cebolla') || lowerName.includes('lechuga') ||
      lowerName.includes('espinaca') || lowerName.includes('apio') || lowerName.includes('pepino') ||
      lowerName.includes('zanahoria') || lowerName.includes('jitomate') || lowerName.includes('nopales') ||
      lowerName.includes('calabacitas') || lowerName.includes('chayote') || lowerName.includes('jicama') ||
      lowerName.includes('perejil') || lowerName.includes('manzana') || lowerName.includes('piña') ||
      lowerName.includes('naranja') || lowerName.includes('fresa') || lowerName.includes('papaya') ||
      lowerName.includes('melón') || lowerName.includes('almendras') || lowerName.includes('almendra') ||
      lowerName.includes('nuez') || lowerName.includes('cacahuate') || lowerName.includes('verdura')) {
    return 'Produce';
  }
  
  // Bakery
  if (lowerName.includes('pan') || lowerName.includes('tortilla') || lowerName.includes('tostada')) {
    return 'Bakery';
  }
  
  // Pantry
  if (lowerName.includes('aceite') || lowerName.includes('sal') || lowerName.includes('pimienta') ||
      lowerName.includes('avena') || lowerName.includes('arroz') || lowerName.includes('frijol') ||
      lowerName.includes('lentejas') || lowerName.includes('mayonesa') || lowerName.includes('canela') ||
      lowerName.includes('limón') || lowerName.includes('salsa') || lowerName.includes('sopa')) {
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