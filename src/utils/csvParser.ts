import { Recipe, MealSlot, Ingredient } from '../types';

// CSV parsing utility for meal plan data
export const parseCSVMealPlan = async (file: File): Promise<{ meals: MealSlot[], recipes: Recipe[] }> => {
  try {
    const text = await file.text();
    console.log('CSV Content:', text.substring(0, 500)); // Debug log
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

  // Day mapping - English only since your CSV uses English days
  const dayMapping: { [key: string]: string } = {
    'monday': 'Monday',
    'tuesday': 'Tuesday', 
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };

  // Meal type mapping - handle your specific format
  const mealTypeMapping: { [key: string]: string } = {
    'breakfast': 'Breakfast',
    'snack m': 'Morning Snack',
    'lunch': 'Lunch', 
    'snack v': 'Afternoon Snack',
    'dinner': 'Dinner'
  };

  // Parse CSV content
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row.');
  }

  // Parse header
  const header = parseCSVRow(lines[0]);
  console.log('Header:', header); // Debug log
  
  // Find column indices (case insensitive)
  const dayIndex = header.findIndex(h => h.toLowerCase().includes('día') || h.toLowerCase().includes('dia'));
  const timeIndex = header.findIndex(h => h.toLowerCase().includes('tiempo') || h.toLowerCase().includes('time'));
  const ingredientIndex = header.findIndex(h => h.toLowerCase().includes('ingrediente') || h.toLowerCase().includes('ingredient'));
  const portionIndex = header.findIndex(h => h.toLowerCase().includes('porción') || h.toLowerCase().includes('porcion') || h.toLowerCase().includes('portion'));

  console.log('Column indices:', { dayIndex, timeIndex, ingredientIndex, portionIndex }); // Debug log

  if (dayIndex === -1 || timeIndex === -1 || ingredientIndex === -1 || portionIndex === -1) {
    throw new Error('CSV must have columns for Day, Time, Ingredient, and Portion');
  }

  // Group ingredients by day and meal type
  const mealGroups: { [key: string]: { [key: string]: Ingredient[] } } = {};

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    
    if (row.length === 0) continue;
    
    const dayRaw = row[dayIndex]?.toLowerCase().trim();
    const mealTypeRaw = row[timeIndex]?.toLowerCase().trim();
    const ingredientName = row[ingredientIndex]?.trim();
    const portion = row[portionIndex]?.trim();
    
    console.log(`Row ${i}:`, { dayRaw, mealTypeRaw, ingredientName, portion }); // Debug log
    
    const dayEnglish = dayMapping[dayRaw];
    const mealTypeEnglish = mealTypeMapping[mealTypeRaw];
    
    if (!dayEnglish || !mealTypeEnglish || !ingredientName) {
      console.log(`Skipping row ${i}: missing data`, { dayEnglish, mealTypeEnglish, ingredientName });
      continue;
    }
    
    // Skip ingredients with empty portions
    if (!portion || portion.toLowerCase() === 'nan') {
      console.log(`Skipping ingredient with no portion: ${ingredientName}`);
      continue;
    }

    // Parse portion to get amount and unit
    const { amount, unit } = parsePortion(portion);
    console.log(`Parsed portion for ${ingredientName}:`, { amount, unit }); // Debug log
    
    // Create ingredient
    const ingredient: Ingredient = {
      id: `ingredient-${Date.now()}-${Math.random()}`,
      name: ingredientName,
      amount: amount,
      unit: unit,
      category: categorizeIngredient(ingredientName)
    };

    // Group ingredients by day and meal type
    if (!mealGroups[dayEnglish]) {
      mealGroups[dayEnglish] = {};
    }
    if (!mealGroups[dayEnglish][mealTypeEnglish]) {
      mealGroups[dayEnglish][mealTypeEnglish] = [];
    }
    mealGroups[dayEnglish][mealTypeEnglish].push(ingredient);
  }

  console.log('Meal groups:', mealGroups); // Debug log

  // Create recipes and meals from grouped ingredients
  Object.entries(mealGroups).forEach(([day, mealTypes]) => {
    Object.entries(mealTypes).forEach(([mealType, ingredients]) => {
      if (ingredients.length === 0) return;

      // Generate recipe name from main ingredients
      const mainIngredients = ingredients.slice(0, 3).map(ing => ing.name);
      const recipeName = mainIngredients.join(', ');
      
      const recipeId = `imported-csv-${Date.now()}-${Math.random()}`;
      const recipe: Recipe = {
        id: recipeId,
        name: recipeName.charAt(0).toUpperCase() + recipeName.slice(1),
        description: `Imported meal with ${ingredients.length} ingredients`,
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
  
  console.log('Final results:', { mealsCount: meals.length, recipesCount: recipes.length }); // Debug log
  return { meals, recipes };
};

// Parse portion string to extract amount and unit
const parsePortion = (portion: string): { amount: number; unit: string } => {
  if (!portion || portion.toLowerCase() === 'nan') {
    return { amount: 1, unit: 'piece' };
  }

  // Handle complex fractions like "0.5/2tza"
  const complexFractionMatch = portion.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*(.*)$/);
  if (complexFractionMatch) {
    const numerator = parseFloat(complexFractionMatch[1]);
    const denominator = parseFloat(complexFractionMatch[2]);
    const unit = normalizeUnit(complexFractionMatch[3].trim() || 'piece');
    return { amount: numerator / denominator, unit };
  }

  // Handle simple fractions like "1/2"
  const simpleFractionMatch = portion.match(/^(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (simpleFractionMatch) {
    const numerator = parseFloat(simpleFractionMatch[1]);
    const denominator = parseFloat(simpleFractionMatch[2]);
    const unit = normalizeUnit(simpleFractionMatch[3].trim() || 'piece');
    return { amount: numerator / denominator, unit };
  }

  // Handle decimal numbers with units like "150g" or "3piece"
  const numberMatch = portion.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (numberMatch) {
    const amount = parseFloat(numberMatch[1]);
    const unit = normalizeUnit(numberMatch[2].trim() || 'piece');
    return { amount, unit };
  }
  
  // If no number found, assume 1 piece
  return { amount: 1, unit: normalizeUnit(portion) };
};

// Parse a single CSV row, handling quoted fields with commas
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

// Normalize units to standard format
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
    'cup': 'cup',
    'cdta': 'tsp',
    'cucharadita': 'tsp',
    'cda': 'tbsp',
    'cucharada': 'tbsp',
    'ctda': 'tbsp',
    'ctdita': 'tsp',
    'pza': 'piece',
    'pieza': 'piece',
    'piezas': 'piece',
    'piece': 'piece',
    'lata': 'can',
    'latas': 'can',
    'can': 'can',
    'rbn': 'slice',
    'rebanada': 'slice',
    'rebanadas': 'slice',
    'slice': 'slice',
    'mitad': 'half',
    'mitades': 'half',
    'half': 'half',
    '': 'piece'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
};

// Categorize ingredients based on name
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