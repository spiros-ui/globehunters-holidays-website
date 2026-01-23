"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhoneNumber {
  id: string;
  label: string;
  number: string;
  formattedNumber: string;
  context: string;
  provider: string;
  isActive: boolean;
  callCount: number;
}

const mockPhoneNumbers: PhoneNumber[] = [
  {
    id: "1",
    label: "Main Sales Line",
    number: "+442089444555",
    formattedNumber: "020 8944 4555",
    context: "default",
    provider: "VoIPStudio",
    isActive: true,
    callCount: 1234,
  },
  {
    id: "2",
    label: "Packages Enquiries",
    number: "+442089444556",
    formattedNumber: "020 8944 4556",
    context: "packages",
    provider: "VoIPStudio",
    isActive: true,
    callCount: 567,
  },
  {
    id: "3",
    label: "Flights Booking",
    number: "+442089444557",
    formattedNumber: "020 8944 4557",
    context: "flights",
    provider: "VoIPStudio",
    isActive: true,
    callCount: 432,
  },
  {
    id: "4",
    label: "Hotels Booking",
    number: "+442089444558",
    formattedNumber: "020 8944 4558",
    context: "hotels",
    provider: "VoIPStudio",
    isActive: true,
    callCount: 289,
  },
  {
    id: "5",
    label: "After Hours",
    number: "+442089444559",
    formattedNumber: "020 8944 4559",
    context: "after-hours",
    provider: "VoIPStudio",
    isActive: false,
    callCount: 78,
  },
];

export default function PhoneNumbersPage() {
  const [phones, setPhones] = useState<PhoneNumber[]>(mockPhoneNumbers);

  const totalCalls = phones.reduce((sum, p) => sum + p.callCount, 0);
  const activeLines = phones.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif mb-2">Phone Numbers</h1>
          <p className="text-muted-foreground">
            Manage tracking phone numbers displayed on the website
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Number
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <Phone className="w-8 h-8 text-primary mb-2" />
          <div className="text-3xl font-semibold">{phones.length}</div>
          <div className="text-sm text-muted-foreground">Total Numbers</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <Phone className="w-8 h-8 text-green-500 mb-2" />
          <div className="text-3xl font-semibold">{activeLines}</div>
          <div className="text-sm text-muted-foreground">Active Lines</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <Phone className="w-8 h-8 text-blue-500 mb-2" />
          <div className="text-3xl font-semibold">{totalCalls.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <Phone className="w-8 h-8 text-orange-500 mb-2" />
          <div className="text-3xl font-semibold">VoIPStudio</div>
          <div className="text-sm text-muted-foreground">Call Provider</div>
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium">Label</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Number</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Context</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Provider</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Calls</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {phones.map((phone) => (
              <tr key={phone.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="font-medium">{phone.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{phone.formattedNumber}</div>
                    <div className="text-xs text-muted-foreground">{phone.number}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary">{phone.context}</Badge>
                </td>
                <td className="px-6 py-4 text-sm">{phone.provider}</td>
                <td className="px-6 py-4 font-medium">{phone.callCount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge variant={phone.isActive ? "default" : "secondary"}>
                    {phone.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
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

      {/* Integration Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <ExternalLink className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">VoIPStudio Integration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Call tracking is powered by VoIPStudio. All incoming calls are
              automatically logged and associated with the page context for
              analytics.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                View Call Analytics
              </Button>
              <Button variant="outline" size="sm">
                VoIPStudio Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
