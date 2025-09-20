import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Utensils, Plus, Trash2, Edit, ChefHat, Download, Info } from 'lucide-react';
import { MealSlot, Recipe } from '../types';
import { getDaysOfWeek, getMealTypes } from '../utils/mealPlanUtils';
import { sampleRecipes } from '../data/sampleRecipes';
import { RecipeForm } from './RecipeForm';
import { RecipeDetailsModal } from './RecipeDetailsModal';
import { saveCustomRecipes, loadCustomRecipes, exportMealPlanCSV } from '../utils/localStorage';

interface MealPlannerProps {
  meals: MealSlot[];
  onMealsUpdate: (meals: MealSlot[]) => void;
  onRecipeUpdate: () => void;
  recipeToEdit?: Recipe | null;
  onRecipeEditComplete?: () => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ 
  meals, 
  onMealsUpdate, 
  onRecipeUpdate, 
  recipeToEdit: externalRecipeToEdit,
  onRecipeEditComplete 
}) => {
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<{ recipe: Recipe; servings: number } | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [hoveredMeal, setHoveredMeal] = useState<{ recipe: Recipe; servings: number; position: { x: number; y: number } } | null>(null);
  
  const days = getDaysOfWeek();
  const mealTypes = getMealTypes();

  // Load custom recipes on component mount
  useEffect(() => {
    setCustomRecipes(loadCustomRecipes());
  }, []);

  // Handle external recipe edit requests (from shopping list)
  useEffect(() => {
    if (externalRecipeToEdit) {
      setRecipeToEdit(externalRecipeToEdit);
      setShowRecipeForm(true);
    }
  }, [externalRecipeToEdit]);

  // Update meals when recipes change
  const updateMealsWithNewRecipe = (updatedRecipe: Recipe) => {
    const updatedMeals = meals.map(meal => {
      if (meal.recipe && meal.recipe.id === updatedRecipe.id) {
        return { ...meal, recipe: updatedRecipe };
      }
      return meal;
    });
    onMealsUpdate(updatedMeals);
  };

  // Remove meals when recipe is deleted
  const removeMealsWithDeletedRecipe = (deletedRecipeId: string) => {
    const updatedMeals = meals.map(meal => {
      if (meal.recipe && meal.recipe.id === deletedRecipeId) {
        return { ...meal, recipe: undefined, servings: undefined };
      }
      return meal;
    });
    onMealsUpdate(updatedMeals);
  };
  const allRecipes = [...sampleRecipes, ...customRecipes];

  const filteredRecipes = allRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || recipe.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveRecipe = (recipe: Recipe) => {
    const isEditing = customRecipes.some(r => r.id === recipe.id);
    const updatedCustomRecipes = isEditing 
      ? customRecipes.map(r => r.id === recipe.id ? recipe : r)
      : [...customRecipes, recipe];
    setCustomRecipes(updatedCustomRecipes);
    saveCustomRecipes(updatedCustomRecipes);
    
    // Update meals that use this recipe
    if (isEditing) {
      updateMealsWithNewRecipe(recipe);
    }
    
    // Trigger shopping list update
    onRecipeUpdate();
    
    setShowRecipeForm(false);
    setRecipeToEdit(null);
    onRecipeEditComplete?.();
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
  };

  const confirmDeleteRecipe = () => {
    if (!recipeToDelete) return;
    
    const updatedCustomRecipes = customRecipes.filter(r => r.id !== recipeToDelete.id);
    setCustomRecipes(updatedCustomRecipes);
    saveCustomRecipes(updatedCustomRecipes);
    
    // Remove this recipe from any meals
    removeMealsWithDeletedRecipe(recipeToDelete.id);
    
    // Trigger shopping list update
    onRecipeUpdate();
    
    setRecipeToDelete(null);
  };

  const cancelDeleteRecipe = () => {
    setRecipeToDelete(null);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setShowRecipeForm(true);
  };

  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day: string, mealType: string) => {
    e.preventDefault();
    if (!draggedRecipe) return;

    const slotId = `${day}-${mealType}`;
    const updatedMeals = meals.map(meal => 
      meal.id === slotId 
        ? { ...meal, recipe: draggedRecipe, servings: draggedRecipe.servings }
        : meal
    );

    onMealsUpdate(updatedMeals);
    setDraggedRecipe(null);
  };

  const removeMeal = (slotId: string) => {
    const updatedMeals = meals.map(meal => 
      meal.id === slotId 
        ? { ...meal, recipe: undefined, servings: undefined }
        : meal
    );
    onMealsUpdate(updatedMeals);
  };

  const updateServings = (slotId: string, servings: number) => {
    const updatedMeals = meals.map(meal => 
      meal.id === slotId 
        ? { ...meal, servings: Math.max(1, servings) }
        : meal
    );
    onMealsUpdate(updatedMeals);
  };

  const getMealForSlot = (day: string, mealType: string) => {
    return meals.find(meal => meal.id === `${day}-${mealType}`);
  };

  const handleRecipeClick = (recipe: Recipe, servings: number) => {
    setSelectedRecipe({ recipe, servings });
  };

  const handleMealHover = (e: React.MouseEvent, recipe: Recipe, servings: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredMeal({
      recipe,
      servings,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  };

  const handleMealLeave = () => {
    setHoveredMeal(null);
  };

  const handleEditFromModal = (recipe: Recipe) => {
    setSelectedRecipe(null);
    handleEditRecipe(recipe);
  };

  const handleClearAll = () => {
    // Clear all custom recipes
    setCustomRecipes([]);
    saveCustomRecipes([]);
    
    // Clear all meals from the current plan
    const clearedMeals = meals.map(meal => ({
      ...meal,
      recipe: undefined,
      servings: undefined
    }));
    onMealsUpdate(clearedMeals);
    
    // Trigger shopping list update
    onRecipeUpdate();
    
    setShowClearConfirmation(false);
  };

  return (
    <div className="space-y-6">
      {/* Recipe Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-blue-600" />
            <span className="hidden sm:inline">Recipe Library ({allRecipes.length} recipes)</span>
            <span className="sm:hidden">Recipes ({allRecipes.length})</span>
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowRecipeForm(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Recipe</span>
              <span className="sm:hidden">Create</span>
            </button>
            <button
              onClick={() => exportMealPlanCSV(meals)}
              disabled={!meals.some(meal => meal.recipe)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
          >
            <option value="All">All Categories</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snacks</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-200 hover:border-blue-300 relative min-h-[120px] flex flex-col"
            >
              <div
                draggable
                onDragStart={() => handleDragStart(recipe)}
                className="cursor-grab flex-1 flex flex-col h-full"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">{recipe.name}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{recipe.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.cookTime}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {recipe.servings}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom section with category and action buttons */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    {recipe.category}
                  </span>
                  
                  {customRecipes.some(cr => cr.id === recipe.id) && (
                    <div className="flex items-center gap-1">
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Custom
                      </div>
                      <button
                        onClick={() => handleEditRecipe(recipe)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Edit recipe"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete recipe"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Meal Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Weekly Meal Plan
        </h3>
        
        {/* Mobile View - Stack by day */}
        <div className="block md:hidden space-y-4">
          {days.map(day => (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-center bg-gray-50 py-2 rounded">
                {day}
              </h4>
              <div className="space-y-3">
                {mealTypes.map(mealType => {
                  const meal = getMealForSlot(day, mealType);
                  return (
                    <div key={`${day}-${mealType}`} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600 mb-2">{mealType}</div>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, mealType)}
                        className="border-2 border-dashed border-gray-200 rounded-lg min-h-[60px] hover:border-blue-300 transition-colors"
                      >
                        {meal?.recipe ? (
                          <div className="bg-blue-50 rounded-lg p-3 h-full border border-blue-200">
                            <div className="flex justify-between items-start mb-2">
                              <h5 
                                className="text-sm font-medium text-blue-900 cursor-pointer hover:text-blue-700 transition-colors flex-1 pr-2"
                                onMouseEnter={(e) => handleMealHover(e, meal.recipe!, meal.servings || meal.recipe!.servings)}
                                onMouseLeave={handleMealLeave}
                                onClick={() => handleRecipeClick(meal.recipe!, meal.servings || meal.recipe!.servings)}
                              >
                                {meal.recipe.name}
                              </h5>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (customRecipes.some(cr => cr.id === meal.recipe!.id)) {
                                    handleEditRecipe(meal.recipe!);
                                  }
                                }}
                                className={`p-1 rounded transition-colors ${
                                  customRecipes.some(cr => cr.id === meal.recipe!.id)
                                    ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                                title={customRecipes.some(cr => cr.id === meal.recipe!.id) ? 'Edit recipe' : 'Cannot edit built-in recipe'}
                                disabled={!customRecipes.some(cr => cr.id === meal.recipe!.id)}
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeMeal(meal.id)}
                                className="text-gray-400 hover:text-red-500 text-lg leading-none"
                              >
                                ×
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-blue-600" />
                              <input
                                type="number"
                                min="1"
                                value={meal.servings || meal.recipe.servings}
                                onChange={(e) => updateServings(meal.id, parseInt(e.target.value))}
                                className="w-12 text-xs px-1 py-0.5 border border-blue-200 rounded"
                              />
                              <span className="text-xs text-blue-700">servings</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm p-3">
                            Drop recipe here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Grid layout */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-8 gap-2">
              {/* Header Row */}
              <div></div>
              {days.map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-50 rounded-lg text-sm min-w-[140px]">
                  {day}
                </div>
              ))}

              {/* Meal Rows */}
              {mealTypes.map(mealType => (
                <React.Fragment key={mealType}>
                  <div className="p-2 font-medium text-gray-700 bg-gray-50 rounded-lg text-xs flex items-center min-w-[100px]">
                    {mealType}
                  </div>
                  {days.map(day => {
                    const meal = getMealForSlot(day, mealType);
                    return (
                      <div
                        key={`${day}-${mealType}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, mealType)}
                        className="p-2 border-2 border-dashed border-gray-200 rounded-lg min-h-[90px] hover:border-blue-300 transition-colors min-w-[140px]"
                      >
                        {meal?.recipe ? (
                          <div className="bg-blue-50 rounded-lg p-2 h-full border border-blue-200 flex flex-col">
                            <div className="flex justify-between items-start mb-2 min-h-0">
                              <h5 
                                className="text-xs font-medium text-blue-900 cursor-pointer hover:text-blue-700 transition-colors flex-1 pr-1 leading-tight"
                                onMouseEnter={(e) => handleMealHover(e, meal.recipe!, meal.servings || meal.recipe!.servings)}
                                onMouseLeave={handleMealLeave}
                                onClick={() => handleRecipeClick(meal.recipe!, meal.servings || meal.recipe!.servings)}
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {meal.recipe.name}
                              </h5>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (customRecipes.some(cr => cr.id === meal.recipe!.id)) {
                                      handleEditRecipe(meal.recipe!);
                                    }
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    customRecipes.some(cr => cr.id === meal.recipe!.id)
                                      ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                      : 'text-gray-300 cursor-not-allowed'
                                  }`}
                                  title={customRecipes.some(cr => cr.id === meal.recipe!.id) ? 'Edit recipe' : 'Cannot edit built-in recipe'}
                                  disabled={!customRecipes.some(cr => cr.id === meal.recipe!.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              <button
                                onClick={() => removeMeal(meal.id)}
                                className="text-gray-400 hover:text-red-500 text-sm leading-none flex-shrink-0 ml-0.5"
                              >
                                ×
                              </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-auto">
                              <Users className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              <input
                                type="number"
                                min="1"
                                value={meal.servings || meal.recipe.servings}
                                onChange={(e) => updateServings(meal.id, parseInt(e.target.value))}
                                className="w-10 text-xs px-1 py-0.5 border border-blue-200 rounded flex-shrink-0"
                              />
                              <span className="text-xs text-blue-700 flex-shrink-0">srv</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center p-1">
                            <span>Drop here</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Creation Form Modal */}
      {showRecipeForm && (
        <RecipeForm
          recipe={recipeToEdit}
          onSave={handleSaveRecipe}
          onCancel={() => {
            setShowRecipeForm(false);
            setRecipeToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {recipeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Recipe</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{recipeToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteRecipe}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecipe}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Clear All Data
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                This action will permanently delete:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>All custom recipes ({customRecipes.length} recipes)</li>
                <li>Current meal plan assignments</li>
                <li>Generated shopping list</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ This action cannot be undone
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe.recipe}
          servings={selectedRecipe.servings}
          onClose={() => setSelectedRecipe(null)}
          onEdit={handleEditFromModal}
          canEdit={customRecipes.some(cr => cr.id === selectedRecipe.recipe.id)}
        />
      )}

      {/* Hover Preview Tooltip */}
      {hoveredMeal && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${hoveredMeal.position.x}px`,
            top: `${hoveredMeal.position.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
            {/* Recipe Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                  {hoveredMeal.recipe.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hoveredMeal.recipe.cookTime}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {hoveredMeal.servings}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    {hoveredMeal.recipe.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {hoveredMeal.recipe.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {hoveredMeal.recipe.description}
              </p>
            )}

            {/* Key Ingredients */}
            {hoveredMeal.recipe.ingredients.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">Key Ingredients:</h5>
                <div className="flex flex-wrap gap-1">
                  {hoveredMeal.recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {ingredient.name}
                    </span>
                  ))}
                  {hoveredMeal.recipe.ingredients.length > 4 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{hoveredMeal.recipe.ingredients.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Nutrition Preview */}
            {hoveredMeal.recipe.nutrition && hoveredMeal.recipe.nutrition.calories > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs font-semibold text-orange-600">
                      {Math.round(hoveredMeal.recipe.nutrition.calories)}
                    </div>
                    <div className="text-xs text-gray-500">cal</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">
                      {Math.round(hoveredMeal.recipe.nutrition.protein)}g
                    </div>
                    <div className="text-xs text-gray-500">protein</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-green-600">
                      {Math.round(hoveredMeal.recipe.nutrition.fiber)}g
                    </div>
                    <div className="text-xs text-gray-500">fiber</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 -mt-px"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};