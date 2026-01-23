"use client";

import {
  Package,
  Plane,
  Building,
  Phone,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";

const stats = [
  {
    name: "Total Calls Today",
    value: "127",
    change: "+12%",
    trend: "up",
    icon: Phone,
  },
  {
    name: "Package Views",
    value: "2,847",
    change: "+8%",
    trend: "up",
    icon: Package,
  },
  {
    name: "Flight Searches",
    value: "1,234",
    change: "+15%",
    trend: "up",
    icon: Plane,
  },
  {
    name: "Hotel Searches",
    value: "892",
    change: "-3%",
    trend: "down",
    icon: Building,
  },
];

const recentCalls = [
  {
    id: 1,
    phone: "+44 7xxx xxx 123",
    page: "Maldives Water Villa Package",
    duration: "4:23",
    time: "10 mins ago",
  },
  {
    id: 2,
    phone: "+44 7xxx xxx 456",
    page: "Bali Retreat Package",
    duration: "2:15",
    time: "25 mins ago",
  },
  {
    id: 3,
    phone: "+44 7xxx xxx 789",
    page: "Dubai Luxury Experience",
    duration: "6:42",
    time: "1 hour ago",
  },
  {
    id: 4,
    phone: "+44 7xxx xxx 012",
    page: "Flights to Paris",
    duration: "3:18",
    time: "2 hours ago",
  },
  {
    id: 5,
    phone: "+44 7xxx xxx 345",
    page: "Thailand Adventure",
    duration: "5:01",
    time: "3 hours ago",
  },
];

const topPackages = [
  { name: "Maldives Water Villa Escape", views: 456, calls: 23 },
  { name: "Bali Jungle & Beach Retreat", views: 389, calls: 18 },
  { name: "Dubai Luxury Experience", views: 312, calls: 15 },
  { name: "Paris & Swiss Alps Getaway", views: 278, calls: 12 },
  { name: "Thailand Adventure", views: 234, calls: 10 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-8 h-8 text-primary" />
              <span
                className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-semibold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Calls */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Recent Calls</h2>
            <p className="text-sm text-muted-foreground">
              Click-to-call activity from the website
            </p>
          </div>
          <div className="divide-y divide-border">
            {recentCalls.map((call) => (
              <div key={call.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{call.phone}</div>
                  <div className="text-sm text-muted-foreground">
                    {call.page}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{call.duration}</div>
                  <div className="text-xs text-muted-foreground">{call.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <button className="text-sm text-primary hover:underline">
              View all calls →
            </button>
          </div>
        </div>

        {/* Top Packages */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Top Performing Packages</h2>
            <p className="text-sm text-muted-foreground">
              Most viewed and converting packages
            </p>
          </div>
          <div className="divide-y divide-border">
            {topPackages.map((pkg, index) => (
              <div key={pkg.name} className="p-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.views} views
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-500">
                    {pkg.calls} calls
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <button className="text-sm text-primary hover:underline">
              View all packages →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
            <Package className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">Add Package</div>
            <div className="text-sm text-muted-foreground">
              Create new holiday package
            </div>
          </button>
          <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
            <DollarSign className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">Update Pricing</div>
            <div className="text-sm text-muted-foreground">
              Manage markup rules
            </div>
          </button>
          <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
            <Phone className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">Phone Numbers</div>
            <div className="text-sm text-muted-foreground">
              Configure tracking numbers
            </div>
          </button>
          <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left">
            <Activity className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">View Analytics</div>
            <div className="text-sm text-muted-foreground">
              Traffic and conversions
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
