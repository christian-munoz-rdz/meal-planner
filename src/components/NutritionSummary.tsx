import React from 'react';
import { BarChart3, Zap, Activity } from 'lucide-react';
import { MealSlot } from '../types';
import { calculateTotalNutrition } from '../utils/mealPlanUtils';

interface NutritionSummaryProps {
  meals: MealSlot[];
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ meals }) => {
  const nutrition = calculateTotalNutrition(meals);
  const dailyTargets = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25
  };

  const getPercentage = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getColorClass = (percentage: number) => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const hasAnyMeals = meals.some(meal => meal.recipe);

  if (!hasAnyMeals) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Daily Nutrition Summary
        </h3>
        <p className="text-gray-500 text-center py-8">
          Add meals to your plan to see nutritional information
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        Daily Nutrition Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Calories */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Calories</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{Math.round(nutrition.calories)}</div>
          <div className="text-xs text-orange-700 mb-2">/ {dailyTargets.calories}</div>
          <div className="w-full bg-orange-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getColorClass(getPercentage(nutrition.calories, dailyTargets.calories))}`}
              style={{ width: `${getPercentage(nutrition.calories, dailyTargets.calories)}%` }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Protein</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{Math.round(nutrition.protein)}g</div>
          <div className="text-xs text-blue-700 mb-2">/ {dailyTargets.protein}g</div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getColorClass(getPercentage(nutrition.protein, dailyTargets.protein))}`}
              style={{ width: `${getPercentage(nutrition.protein, dailyTargets.protein)}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-yellow-800">Carbs</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{Math.round(nutrition.carbs)}g</div>
          <div className="text-xs text-yellow-700 mb-2">/ {dailyTargets.carbs}g</div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getColorClass(getPercentage(nutrition.carbs, dailyTargets.carbs))}`}
              style={{ width: `${getPercentage(nutrition.carbs, dailyTargets.carbs)}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-purple-800">Fat</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{Math.round(nutrition.fat)}g</div>
          <div className="text-xs text-purple-700 mb-2">/ {dailyTargets.fat}g</div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getColorClass(getPercentage(nutrition.fat, dailyTargets.fat))}`}
              style={{ width: `${getPercentage(nutrition.fat, dailyTargets.fat)}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-green-800">Fiber</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{Math.round(nutrition.fiber)}g</div>
          <div className="text-xs text-green-700 mb-2">/ {dailyTargets.fiber}g</div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getColorClass(getPercentage(nutrition.fiber, dailyTargets.fiber))}`}
              style={{ width: `${getPercentage(nutrition.fiber, dailyTargets.fiber)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on 2000 calorie daily diet. Adjust targets based on your individual needs.
      </div>
    </div>
  );
};