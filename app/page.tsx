"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle, 
  Package, 
  Layers, 
  DollarSign, 
  CheckCircle, 
  X,
  PlusCircle,
  MinusCircle
} from "lucide-react";

// SML Type Interfaces
interface Product {
  id: string;
  name: string;
  sku: string;
  category: "food" | "electronics" | "school_supplies" | "clothing" | "tools" | "medicine" | "other";
  stock: number;
  low_stock_limit: number;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  created_at: string;
  updated_at: string;
}

type AppStatus = "idle" | "creating" | "editing" | "saving" | "deleting" | "error";
type CategoryFilterType = "all" | "food" | "electronics" | "school_supplies" | "clothing" | "tools" | "medicine" | "other";

const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Wireless Mouse",
    sku: "ELEC-MSE-001",
    category: "electronics",
    stock: 12,
    low_stock_limit: 5,
    price: 29.99,
    status: "in_stock",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-2",
    name: "Organic Milk 1L",
    sku: "FOOD-MLK-002",
    category: "food",
    stock: 2,
    low_stock_limit: 6,
    price: 3.49,
    status: "low_stock",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-3",
    name: "Notebook A5",
    sku: "SCH-NTE-003",
    category: "school_supplies",
    stock: 0,
    low_stock_limit: 10,
    price: 1.99,
    status: "out_of_stock",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function InventoryDashboardPage() {
  // Runtime State Properties Management
  const [products, setProducts] = useState<Product[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>("idle");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form Bindings State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState<Product["category"]>("other");
  const [formStock, setFormStock] = useState<number>(0);
  const [formLowStockLimit, setFormLowStockLimit] = useState<number>(5);
  const [formPrice, setFormPrice] = useState<number>(0);

  // Load from Local Storage Layer
  useEffect(() => {
    const saved = localStorage.getItem("sml_inventory_products");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        setProducts(initialProducts);
      }
    } else {
      setProducts(initialProducts);
    }
  }, []);

  // Save to Local Storage Side-Effect Trigger
  const persistToStorage = (updatedList: Product[]) => {
    localStorage.setItem("sml_inventory_products", JSON.stringify(updatedList));
  };

  // Status computation core mapping SML Branch evaluation mechanics
  const computeProductStatus = (stock: number, lowStockLimit: number): Product["status"] => {
    if (stock === 0) return "out_of_stock"; // OutOfStockRule
    if (stock <= lowStockLimit) return "low_stock"; // LowStockRule
    return "in_stock"; // InStockRule
  };

  // State Machine Guard Logic checking transition valid paths
  const transitionTo = (nextStatus: AppStatus) => {
    setAppStatus(nextStatus);
  };

  // Actions implementations
  const handleStartCreateProduct = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("other");
    setFormStock(0);
    setFormLowStockLimit(5);
    setFormPrice(0);
    setSelectedProductId(null);
    transitionTo("creating");
  };

  const handleStartEditProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCategory(product.category);
    setFormStock(product.stock);
    setFormLowStockLimit(product.low_stock_limit);
    setFormPrice(product.price);
    transitionTo("editing");
  };

  const handleCancelProductForm = () => {
    setSelectedProductId(null);
    setErrorMessage(null);
    transitionTo("idle");
  };

  const handleDismissError = () => {
    setErrorMessage(null);
    transitionTo("idle");
  };

  const checkDuplicateSku = (sku: string, currentId: string | null): boolean => {
    return products.some(p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== currentId);
  };

  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transitionTo("saving");

    // DuplicateSkuRule validation
    if (checkDuplicateSku(formSku, selectedProductId)) {
      setErrorMessage("SKU already exists. Use a unique SKU.");
      transitionTo("error");
      return;
    }

    const timestamp = new Date().toISOString();

    if (appStatus === "creating") {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formName,
        sku: formSku,
        category: formCategory,
        stock: formStock,
        low_stock_limit: formLowStockLimit,
        price: formPrice,
        status: computeProductStatus(formStock, formLowStockLimit),
        created_at: timestamp,
        updated_at: timestamp
      };
      const updated = [...products, newProduct];
      setProducts(updated);
      persistToStorage(updated);
      transitionTo("idle");
    } else if (appStatus === "editing" && selectedProductId) {
      const updated = products.map(p => {
        if (p.id === selectedProductId) {
          return {
            ...p,
            name: formName,
            sku: formSku,
            category: formCategory,
            stock: formStock,
            low_stock_limit: formLowStockLimit,
            price: formPrice,
            status: computeProductStatus(formStock, formLowStockLimit),
            updated_at: timestamp
          };
        }
        return p;
      });
      setProducts(updated);
      persistToStorage(updated);
      setSelectedProductId(null);
      transitionTo("idle");
    }
  };

  const handleDeleteProduct = (id: string) => {
    transitionTo("deleting");
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    persistToStorage(updated);
    if (selectedProductId === id) setSelectedProductId(null);
    transitionTo("idle");
  };

  const handleIncreaseStock = (id: string, amount: number = 1) => {
    const updated = products.map(p => {
      if (p.id === id) {
        const nextStock = p.stock + amount;
        return {
          ...p,
          stock: nextStock,
          status: computeProductStatus(nextStock, p.low_stock_limit),
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });
    setProducts(updated);
    persistToStorage(updated);
  };

  const handleDecreaseStock = (id: string, amount: number = 1) => {
    const updated = products.map(p => {
      if (p.id === id) {
        const nextStock = Math.max(0, p.stock - amount); // clamp_min([Product.stock], 0)
        return {
          ...p,
          stock: nextStock,
          status: computeProductStatus(nextStock, p.low_stock_limit),
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });
    setProducts(updated);
    persistToStorage(updated);
  };

  // Compute Iterators Evaluated States
  const totals = products.reduce(
    (acc, product) => {
      acc.totalProducts += 1;
      acc.totalStock += product.stock;
      acc.totalValue += product.stock * product.price;
      if (product.status === "low_stock") acc.lowStockCount += 1;
      if (product.status === "out_of_stock") acc.outOfStockCount += 1;
      return acc;
    },
    { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 }
  );

  // SML inventory_health_text describe logic evaluation
  let inventoryHealthText = "Inventory looks healthy";
  let healthBannerStyle = "bg-emerald-950/40 text-emerald-400 border-emerald-800/60";
  if (totals.outOfStockCount > 0) {
    inventoryHealthText = "Some products are out of stock";
    healthBannerStyle = "bg-rose-950/40 text-rose-400 border-rose-800/60";
  } else if (totals.lowStockCount > 0) {
    inventoryHealthText = "Some products are running low";
    healthBannerStyle = "bg-amber-950/40 text-amber-400 border-amber-800/60";
  }

  // Filtered dataset expression parsing
  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header System Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[color:var(--color-primary)] animate-pulse" />
            Mini Inventory System
          </h1>
          <p className="text-slate-400 text-sm mt-1">Jorj Project #6</p>
        </div>
        <div>
          <button
            onClick={handleStartCreateProduct}
            className="inline-flex items-center gap-2 bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/80 text-white font-medium px-4 py-2.5 rounded-[var(--radius-custom)] shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Product
          </button>
        </div>
      </header>

      {/* SML Action Error Banner */}
      {appStatus === "error" && errorMessage && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-[var(--radius-custom)] p-4 text-red-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button 
            onClick={handleDismissError}
            className="p-1 rounded-full hover:bg-red-900 text-red-400 hover:text-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inventory Health Banner Layout */}
      <div className={`border p-4 rounded-[var(--radius-custom)] text-sm font-medium flex items-center gap-3 ${healthBannerStyle} transition-colors shadow-sm`}>
        <Package className="w-4 h-4" />
        <span>SYSTEM STATUS: {inventoryHealthText}</span>
      </div>

      {/* Analytics Summary Grid Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[var(--radius-custom)] shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Products</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.totalProducts}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[var(--radius-custom)] shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Total Items Stock</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.totalStock}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[var(--radius-custom)] shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Inventory Value</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white">₱{totals.totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[var(--radius-custom)] shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{totals.lowStockCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[var(--radius-custom)] shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Out of Stock</span>
            <X className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">{totals.outOfStockCount}</div>
        </div>
      </section>

      {/* Control Utility Module (Search & Categories) */}
      <section className="flex flex-col sm:flex-row gap-3 bg-slate-900 p-4 border border-slate-800 rounded-[var(--radius-custom)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-sm rounded-lg text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)] transition-colors"
          />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryFilterType)}
            className="w-full bg-slate-950 border border-slate-800 pl-9 pr-8 py-2 text-sm rounded-lg text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="food">Food</option>
            <option value="electronics">Electronics</option>
            <option value="school_supplies">School Supplies</option>
            <option value="clothing">Clothing</option>
            <option value="tools">Tools</option>
            <option value="medicine">Medicine</option>
            <option value="other">Other</option>
          </select>
        </div>
      </section>

      {/* Interactive Modal Form Pipeline (Create / Edit) */}
      {(appStatus === "creating" || appStatus === "editing") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[var(--radius-custom)] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {appStatus === "creating" ? "Add New Product" : "Edit Existing Product"}
              </h3>
              <button 
                onClick={handleCancelProductForm}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            <form onSubmit={handleProductFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Product["category"])}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)] cursor-pointer"
                  >
                    <option value="food">Food</option>
                    <option value="electronics">Electronics</option>
                    <option value="school_supplies">School Supplies</option>
                    <option value="clothing">Clothing</option>
                    <option value="tools">Tools</option>
                    <option value="medicine">Medicine</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formLowStockLimit}
                    onChange={(e) => setFormLowStockLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)]"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-400">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[color:var(--color-primary)]"
                  />
                </div>
              </div>
              <footer className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={handleCancelProductForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Save Product
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid View Core Table Component */}
      <section className="bg-slate-900 border border-slate-800 rounded-[var(--radius-custom)] shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-600 stroke-1" />
            <div>
              <p className="text-base font-medium text-slate-400">No products matching filters found</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting your queries or declare a new inventory entry item.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">SKU / Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Stock Actions</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Updated: {new Date(product.updated_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded text-slate-400">
                        {product.sku}
                      </span>
                      <div className="text-xs text-slate-400 capitalize mt-1.5">{product.category.replace("_", " ")}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      ₱{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDecreaseStock(product.id, 1)}
                          title="Decrease Stock"
                          className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-colors"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-base min-w-[24px] text-center text-white">
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleIncreaseStock(product.id, 1)}
                          title="Increase Stock"
                          className="text-slate-500 hover:text-emerald-400 p-1 hover:bg-slate-800 rounded transition-colors"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 text-center mt-1">Limit: {product.low_stock_limit}</div>
                    </td>
                    <td className="px-6 py-4">
                      {product.status === "in_stock" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3. h-3" /> In Stock
                        </span>
                      )}
                      {product.status === "low_stock" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      )}
                      {product.status === "out_of_stock" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <X className="w-3 h-3" /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEditProduct(product)}
                          className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}