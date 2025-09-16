import React, { useState, useEffect } from 'react';
import { Calendar, ShoppingCart, BookOpen, BarChart3, ChefHat } from 'lucide-react';
import { MealSlot, MealPlan, ShoppingListItem } from './types';
import { MealPlanner } from './components/MealPlanner';
import { ShoppingList } from './components/ShoppingList';
import { SavedPlans } from './components/SavedPlans';
import { NutritionSummary } from './components/NutritionSummary';
import { getDaysOfWeek, getMealTypes, generateShoppingList } from './utils/mealPlanUtils';
import { saveMealPlans, loadMealPlans, saveShoppingList, loadShoppingList } from './utils/localStorage';

type Tab = 'planner' | 'shopping' | 'plans' | 'nutrition';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [meals, setMeals] = useState<MealSlot[]>([]);
  const [savedPlans, setSavedPlans] = useState<MealPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [recipeUpdateTrigger, setRecipeUpdateTrigger] = useState(0);

  // Initialize empty meal slots
  useEffect(() => {
    const days = getDaysOfWeek();
    const mealTypes = getMealTypes();
    
    const initialMeals: MealSlot[] = [];
    days.forEach(day => {
      mealTypes.forEach(mealType => {
        initialMeals.push({
          id: `${day}-${mealType}`,
          day,
          mealType: mealType as any
        });
      });
    });
    
    setMeals(initialMeals);
  }, []);

  // Load saved data on component mount
  useEffect(() => {
    setSavedPlans(loadMealPlans());
    setShoppingList(loadShoppingList());
  }, []);

  // Generate shopping list when meals change
  useEffect(() => {
    const newShoppingList = generateShoppingList(meals);
    setShoppingList(newShoppingList);
    saveShoppingList(newShoppingList);
  }, [meals, recipeUpdateTrigger]);

  // Function to trigger updates when recipes change
  const handleRecipeUpdate = () => {
    setRecipeUpdateTrigger(prev => prev + 1);
  };
  const handleSavePlan = (name: string, planMeals: MealSlot[]) => {
    const newPlan: MealPlan = {
      id: `plan-${Date.now()}`,
      name,
      week: new Date().toISOString().split('T')[0],
      meals: planMeals,
      createdAt: new Date()
    };
    
    const updatedPlans = [...savedPlans, newPlan];
    setSavedPlans(updatedPlans);
    saveMealPlans(updatedPlans);
  };

  const handleLoadPlan = (planMeals: MealSlot[]) => {
    setMeals(planMeals);
    setActiveTab('planner');
  };

  const handleDeletePlan = (planId: string) => {
    const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
    setSavedPlans(updatedPlans);
    saveMealPlans(updatedPlans);
  };

  const handleUpdateShoppingList = (updatedList: ShoppingListItem[]) => {
    setShoppingList(updatedList);
    saveShoppingList(updatedList);
  };

  const tabs = [
    { id: 'planner' as const, label: 'Meal Planner', icon: Calendar, color: 'blue' },
    { id: 'shopping' as const, label: 'Shopping List', icon: ShoppingCart, color: 'green' },
    { id: 'plans' as const, label: 'Saved Plans', icon: BookOpen, color: 'purple' },
    { id: 'nutrition' as const, label: 'Nutrition', icon: BarChart3, color: 'orange' }
  ];

  const getTabColorClass = (tabId: Tab, color: string, isActive: boolean) => {
    if (isActive) {
      return {
        blue: 'border-blue-500 text-blue-600 bg-blue-50',
        green: 'border-green-500 text-green-600 bg-green-50',
        purple: 'border-purple-500 text-purple-600 bg-purple-50',
        orange: 'border-orange-500 text-orange-600 bg-orange-50'
      }[color];
    }
    return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">MealPlan Pro</h1>
                <p className="text-sm text-gray-500">Smart meal planning & grocery lists</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Week of {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    getTabColorClass(tab.id, tab.color, isActive)
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'planner' && (
          <MealPlanner meals={meals} onMealsUpdate={setMeals} />
        )}
        
        {activeTab === 'shopping' && (
          <ShoppingList 
            shoppingList={shoppingList} 
            onUpdateShoppingList={handleUpdateShoppingList} 
          />
        )}
        
        {activeTab === 'plans' && (
          <SavedPlans
            mealPlans={savedPlans}
            currentMeals={meals}
            onSavePlan={handleSavePlan}
            onLoadPlan={handleLoadPlan}
            onDeletePlan={handleDeletePlan}
          />
        )}
        
        {activeTab === 'nutrition' && (
          <NutritionSummary meals={meals} />
        )}
      </main>
    </div>
  );
}

export default App;