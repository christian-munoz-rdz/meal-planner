import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Utensils, Plus, Trash2, Edit, ChefHat } from 'lucide-react';
import { MealSlot, Recipe } from '../types';
import { getDaysOfWeek, getMealTypes } from '../utils/mealPlanUtils';
import { sampleRecipes } from '../data/sampleRecipes';
import { RecipeForm } from './RecipeForm';
import { RecipeDetailsModal } from './RecipeDetailsModal';
import { saveCustomRecipes, loadCustomRecipes } from '../utils/localStorage';

interface MealPlannerProps {
  meals: MealSlot[];
  onMealsUpdate: (meals: MealSlot[]) => void;
  onRecipeUpdate: () => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ meals, onMealsUpdate, onRecipeUpdate }) => {
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<{ recipe: Recipe; servings: number } | null>(null);
  
  const days = getDaysOfWeek();
  const mealTypes = getMealTypes();

  // Load custom recipes on component mount
  useEffect(() => {
    setCustomRecipes(loadCustomRecipes());
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Recipe Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-blue-600" />
            Recipe Library ({allRecipes.length} recipes)
          </h3>
          <button
            onClick={() => setShowRecipeForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Recipe
          </button>
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
              className="bg-gray-50 rounded-lg p-3 lg:p-4 hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-200 hover:border-blue-300 relative"
            >
              {customRecipes.some(cr => cr.id === recipe.id) && (
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Custom
                  </div>
                  <button
                    onClick={() => handleEditRecipe(recipe)}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="Edit recipe"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Delete recipe"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div
                draggable
                onDragStart={() => handleDragStart(recipe)}
                className="cursor-grab"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm lg:text-base truncate">{recipe.name}</h4>
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                    <div className="flex items-center gap-2 lg:gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.cookTime}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {recipe.servings}
                      </span>
                      <span className="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {recipe.category}
                      </span>
                    </div>
                  </div>
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
                                onClick={() => handleRecipeClick(meal.recipe!, meal.servings || meal.recipe!.servings)}
                              >
                                {meal.recipe.name}
                              </h5>
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
          <div className="min-w-full">
            <div className="grid grid-cols-8 gap-3">
              {/* Header Row */}
              <div></div>
              {days.map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50 rounded-lg text-sm lg:text-base">
                  {day}
                </div>
              ))}

              {/* Meal Rows */}
              {mealTypes.map(mealType => (
                <React.Fragment key={mealType}>
                  <div className="p-2 lg:p-3 font-medium text-gray-700 bg-gray-50 rounded-lg text-xs lg:text-sm flex items-center">
                    {mealType}
                  </div>
                  {days.map(day => {
                    const meal = getMealForSlot(day, mealType);
                    return (
                      <div
                        key={`${day}-${mealType}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, mealType)}
                        className="p-1 lg:p-2 border-2 border-dashed border-gray-200 rounded-lg min-h-[70px] lg:min-h-[80px] hover:border-blue-300 transition-colors"
                      >
                        {meal?.recipe ? (
                          <div className="bg-blue-50 rounded-lg p-2 lg:p-3 h-full border border-blue-200">
                            <div className="flex justify-between items-start mb-2">
                              <h5 
                                className="text-xs lg:text-sm font-medium text-blue-900 line-clamp-2 cursor-pointer hover:text-blue-700 transition-colors flex-1 pr-1"
                                onClick={() => handleRecipeClick(meal.recipe!, meal.servings || meal.recipe!.servings)}
                              >
                                {meal.recipe.name}
                              </h5>
                              <button
                                onClick={() => removeMeal(meal.id)}
                                className="text-gray-400 hover:text-red-500 text-sm lg:text-base leading-none flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              <input
                                type="number"
                                min="1"
                                value={meal.servings || meal.recipe.servings}
                                onChange={(e) => updateServings(meal.id, parseInt(e.target.value))}
                                className="w-8 lg:w-12 text-xs px-1 py-0.5 border border-blue-200 rounded"
                              />
                              <span className="text-xs text-blue-700 hidden lg:inline">servings</span>
                              <span className="text-xs text-blue-700 lg:hidden">srv</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs lg:text-sm text-center p-1">
                            <span className="hidden lg:inline">Drop recipe here</span>
                            <span className="lg:hidden">Drop here</span>
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

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe.recipe}
          servings={selectedRecipe.servings}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
};