import React, { useState } from 'react';
import { BookOpen, Calendar, Download, Trash2, Plus } from 'lucide-react';
import { MealPlan, MealSlot } from '../types';
import { exportMealPlan } from '../utils/localStorage';

interface SavedPlansProps {
  mealPlans: MealPlan[];
  currentMeals: MealSlot[];
  onSavePlan: (name: string, meals: MealSlot[]) => void;
  onLoadPlan: (meals: MealSlot[]) => void;
  onDeletePlan: (planId: string) => void;
}

export const SavedPlans: React.FC<SavedPlansProps> = ({
  mealPlans,
  currentMeals,
  onSavePlan,
  onLoadPlan,
  onDeletePlan
}) => {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [planName, setPlanName] = useState('');

  const handleSave = () => {
    if (planName.trim() && currentMeals.some(meal => meal.recipe)) {
      onSavePlan(planName.trim(), currentMeals);
      setPlanName('');
      setShowSaveForm(false);
    }
  };

  const hasCurrentMeals = currentMeals.some(meal => meal.recipe);
  const mealsInPlan = (meals: MealSlot[]) => meals.filter(meal => meal.recipe).length;

  return (
    <div className="space-y-6">
      {/* Save Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Save Current Plan
        </h3>

        {hasCurrentMeals ? (
          <div>
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Save Current Meal Plan
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Enter a name for this meal plan..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!planName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Plan
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveForm(false);
                      setPlanName('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Add meals to your weekly plan to save it for later.</p>
        )}
      </div>

      {/* Saved Plans List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Saved Meal Plans ({mealPlans.length})
        </h3>

        {mealPlans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No saved meal plans yet. Save your first plan to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {mealPlans.map(plan => (
              <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{plan.name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Week of {plan.week}
                      </span>
                      <span>{mealsInPlan(plan.meals)} meals planned</span>
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onLoadPlan(plan.meals)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => exportMealPlan(plan)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Export plan"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};