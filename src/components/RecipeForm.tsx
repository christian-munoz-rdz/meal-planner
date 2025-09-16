import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, X } from 'lucide-react';
import { Recipe, Ingredient, GroceryCategory } from '../types';

interface RecipeFormProps {
  recipe?: Recipe; // Optional recipe for editing
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: ''
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: 1, unit: 'cup', category: 'Pantry' }
  ]);

  const groceryCategories: GroceryCategory[] = [
    'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry', 
    'Frozen', 'Bakery', 'Beverages', 'Other'
  ];

  const units = [
    'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l',
    'piece', 'slice', 'clove', 'can', 'package', 'bunch', 'head',
    'large', 'medium', 'small', 'whole'
  ];

  // Initialize form with recipe data if editing
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name
      });
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [
        { id: '1', name: '', amount: 1, unit: 'cup', category: 'Pantry' }
      ]);
    }
  }, [recipe]);

  const addIngredient = () => {
    setIngredients([...ingredients, {
      id: Date.now().toString(),
      name: '',
      amount: 1,
      unit: 'cup',
      category: 'Pantry'
    }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = ingredients.map((ingredient, i) => 
      i === index ? { ...ingredient, [field]: value } : ingredient
    );
    setIngredients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please fill in recipe name');
      return;
    }

    if (ingredients.some(ing => !ing.name.trim())) {
      alert('Please fill in all ingredient names');
      return;
    }

    const savedRecipe: Recipe = {
      id: recipe?.id || `custom-${Date.now()}`,
      ...formData,
      image: '', // Set empty since we're using icons
      cookTime: 30, // Default cook time
      servings: 1, // Default servings for 1 person
      difficulty: 'Medium' as const, // Default difficulty
      category: 'Dinner' as const, // Default category
      description: '', // Set empty since we removed description field
      cuisine: '', // Set empty since we removed cuisine field
      ingredients: ingredients.filter(ing => ing.name.trim()),
      instructions: [], // Set empty since we removed instructions field
      nutrition: { // Set default values since we removed nutrition fields
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      }
    };

    onSave(savedRecipe);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {recipe ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter recipe name..."
              required
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ingredient Name
                    </label>
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Large yellow onion"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Category
                    </label>
                    <select
                      value={ingredient.category}
                      onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {groceryCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              {recipe ? 'Update Recipe' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};