"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingRule {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "tiered";
  productType: "flight" | "hotel" | "activity" | "package" | "all";
  value: number;
  minValue?: number;
  maxValue?: number;
  currency: string;
  isActive: boolean;
  priority: number;
}

const mockPricingRules: PricingRule[] = [
  {
    id: "1",
    name: "Standard Flight Markup",
    type: "percentage",
    productType: "flight",
    value: 8,
    currency: "GBP",
    isActive: true,
    priority: 1,
  },
  {
    id: "2",
    name: "Hotel Commission",
    type: "percentage",
    productType: "hotel",
    value: 12,
    currency: "GBP",
    isActive: true,
    priority: 1,
  },
  {
    id: "3",
    name: "Activity Markup",
    type: "percentage",
    productType: "activity",
    value: 15,
    currency: "GBP",
    isActive: true,
    priority: 1,
  },
  {
    id: "4",
    name: "Package Discount",
    type: "percentage",
    productType: "package",
    value: -5,
    currency: "GBP",
    isActive: true,
    priority: 2,
  },
  {
    id: "5",
    name: "Premium Flight Fee",
    type: "fixed",
    productType: "flight",
    value: 25,
    minValue: 500,
    currency: "GBP",
    isActive: true,
    priority: 2,
  },
];

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>(mockPricingRules);
  const [editingId, setEditingId] = useState<string | null>(null);

  const productTypeColors: Record<string, string> = {
    flight: "bg-blue-500",
    hotel: "bg-green-500",
    activity: "bg-purple-500",
    package: "bg-orange-500",
    all: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif mb-2">Pricing Rules</h1>
          <p className="text-muted-foreground">
            Configure markup and commission rules for different product types
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Rules Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Product</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Type</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Value</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Conditions</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Priority</th>
              <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">
                  <div className="font-medium">{rule.name}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={productTypeColors[rule.productType]}>
                    {rule.productType}
                  </Badge>
                </td>
                <td className="px-6 py-4 capitalize">{rule.type}</td>
                <td className="px-6 py-4">
                  {rule.type === "percentage"
                    ? `${rule.value > 0 ? "+" : ""}${rule.value}%`
                    : `£${rule.value}`}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {rule.minValue ? `Min: £${rule.minValue}` : "-"}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-6 py-4">{rule.priority}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-2">Percentage Rules</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Apply a percentage markup or discount to the base price
          </p>
          <div className="text-sm">
            <div className="flex justify-between py-1">
              <span>Active rules:</span>
              <span className="font-medium">4</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Avg markup:</span>
              <span className="font-medium">+10%</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-2">Fixed Fee Rules</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add a fixed amount to specific product types
          </p>
          <div className="text-sm">
            <div className="flex justify-between py-1">
              <span>Active rules:</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Avg fee:</span>
              <span className="font-medium">£25</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-2">Rule Priority</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Rules are applied in order of priority (lowest first)
          </p>
          <div className="text-sm">
            <div className="flex justify-between py-1">
              <span>Priority 1:</span>
              <span className="font-medium">Base markups</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Priority 2:</span>
              <span className="font-medium">Adjustments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
