import React, { useState, useMemo } from 'react';
import { ShoppingCart, Check, Download, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { ShoppingListItem, GroceryCategory } from '../types';
import { exportShoppingList } from '../utils/localStorage';

interface ShoppingListProps {
  shoppingList: ShoppingListItem[];
  onUpdateShoppingList: (list: ShoppingListItem[]) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  shoppingList, 
  onUpdateShoppingList 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<GroceryCategory>>(
    new Set(['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry'])
  );

  const groupedItems = useMemo(() => {
    return shoppingList.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<GroceryCategory, ShoppingListItem[]>);
  }, [shoppingList]);

  const toggleItemComplete = (itemId: string) => {
    const updatedList = shoppingList.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateShoppingList(updatedList);
  };

  const toggleCategoryExpanded = (category: GroceryCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const completedCount = shoppingList.filter(item => item.completed).length;
  const totalCount = shoppingList.length;

  const categoryOrder: GroceryCategory[] = [
    'Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery', 
    'Frozen', 'Pantry', 'Beverages', 'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            Shopping List
          </h3>
          <button
            onClick={() => exportShoppingList(shoppingList)}
            disabled={shoppingList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export List
          </button>
        </div>

        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{completedCount} of {totalCount} items</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shopping List Items by Category */}
      {shoppingList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No items in your shopping list</h4>
          <p className="text-gray-500">Add meals to your weekly plan to generate a shopping list</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoryOrder.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;

            const isExpanded = expandedCategories.has(category);
            const completedInCategory = items.filter(item => item.completed).length;

            return (
              <div key={category} className="bg-white rounded-lg shadow-sm border">
                <button
                  onClick={() => toggleCategoryExpanded(category)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <h4 className="font-medium text-gray-800">{category}</h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {completedInCategory}/{items.length}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 pb-4">
                    <div className="space-y-2 pt-4">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            item.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <button
                            onClick={() => toggleItemComplete(item.id)}
                            className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                              item.completed 
                                ? 'bg-green-600 border-green-600 text-white' 
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {item.completed && <Check className="h-3 w-3" />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                item.completed ? 'text-green-800 line-through' : 'text-gray-800'
                              }`}>
                                {item.amount} {item.unit} {item.name}
                              </span>
                            </div>
                            {item.recipeNames.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                For: {item.recipeNames.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};