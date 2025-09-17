import React from 'react';
import { X, Clock, Users, ChefHat, Utensils, Edit } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeDetailsModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
  onEdit?: (recipe: Recipe) => void;
  canEdit?: boolean;
}

export const RecipeDetailsModal: React.FC<RecipeDetailsModalProps> = ({
  recipe,
  servings,
  onClose,
  onEdit,
  canEdit = false
}) => {
  const servingMultiplier = servings / recipe.servings;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{recipe.name}</h2>
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(recipe)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Recipe
              </button>
            )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Recipe Icon */}
          <div className="w-full h-48 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Utensils className="h-24 w-24 text-blue-600" />
          </div>

          {/* Recipe Info */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{recipe.cookTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{servings} serving{servings !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span>{recipe.difficulty}</span>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {recipe.category}
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600">{recipe.description}</p>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Ingredients ({servings} serving{servings !== 1 ? 's' : ''})
            </h3>
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">
                      {(ingredient.amount * servingMultiplier).toFixed(ingredient.amount * servingMultiplier % 1 === 0 ? 0 : 2)} {ingredient.unit} {ingredient.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {ingredient.category}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Instructions</h3>
              <div className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition */}
          {recipe.nutrition && (recipe.nutrition.calories > 0 || recipe.nutrition.protein > 0) && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Nutrition (per serving)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-orange-900">
                    {Math.round(recipe.nutrition.calories)}
                  </div>
                  <div className="text-xs text-orange-700">Calories</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-900">
                    {Math.round(recipe.nutrition.protein)}g
                  </div>
                  <div className="text-xs text-blue-700">Protein</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-900">
                    {Math.round(recipe.nutrition.carbs)}g
                  </div>
                  <div className="text-xs text-yellow-700">Carbs</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-900">
                    {Math.round(recipe.nutrition.fat)}g
                  </div>
                  <div className="text-xs text-purple-700">Fat</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-900">
                    {Math.round(recipe.nutrition.fiber)}g
                  </div>
                  <div className="text-xs text-green-700">Fiber</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};