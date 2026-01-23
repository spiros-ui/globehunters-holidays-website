"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, FileText, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContentBlock {
  id: string;
  key: string;
  title: string;
  content: string;
  type: "text" | "html" | "json";
  page: string;
  lastUpdated: string;
  updatedBy: string;
}

const mockContentBlocks: ContentBlock[] = [
  {
    id: "1",
    key: "hero_title",
    title: "Homepage Hero Title",
    content: "Discover Your Perfect Holiday",
    type: "text",
    page: "homepage",
    lastUpdated: "2024-01-15",
    updatedBy: "admin@globehunters.com",
  },
  {
    id: "2",
    key: "hero_subtitle",
    title: "Homepage Hero Subtitle",
    content: "Handcrafted holiday packages to the world's most beautiful destinations. Let our travel experts create your dream getaway.",
    type: "text",
    page: "homepage",
    lastUpdated: "2024-01-15",
    updatedBy: "admin@globehunters.com",
  },
  {
    id: "3",
    key: "trust_badges",
    title: "Trust Badges Section",
    content: JSON.stringify([
      { icon: "award", title: "ATOL Protected", description: "Your money is 100% protected" },
      { icon: "clock", title: "24/7 Support", description: "Expert help anytime, anywhere" },
      { icon: "star", title: "5-Star Rated", description: "Thousands of happy customers" },
    ]),
    type: "json",
    page: "homepage",
    lastUpdated: "2024-01-10",
    updatedBy: "admin@globehunters.com",
  },
  {
    id: "4",
    key: "about_intro",
    title: "About Page Introduction",
    content: "<p>GlobeHunters Holidays has been creating unforgettable travel experiences since 2005...</p>",
    type: "html",
    page: "about",
    lastUpdated: "2024-01-08",
    updatedBy: "admin@globehunters.com",
  },
  {
    id: "5",
    key: "contact_info",
    title: "Contact Information",
    content: JSON.stringify({
      phone: "020 8944 4555",
      email: "info@globehuntersholidays.com",
      address: "123 Travel Street, London SW1A 1AA",
    }),
    type: "json",
    page: "contact",
    lastUpdated: "2024-01-05",
    updatedBy: "admin@globehunters.com",
  },
];

export default function ContentPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(mockContentBlocks);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);

  const typeColors: Record<string, string> = {
    text: "bg-blue-500",
    html: "bg-orange-500",
    json: "bg-purple-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif mb-2">Content Management</h1>
          <p className="text-muted-foreground">
            Edit website content blocks and static text
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Block
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Content Blocks List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Content Blocks</h2>
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`bg-card rounded-xl border p-4 cursor-pointer transition-colors ${
                  selectedBlock?.id === block.id
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedBlock(block)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{block.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Key: {block.key}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{block.page}</Badge>
                    <Badge className={typeColors[block.type]}>{block.type}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {block.type === "json"
                    ? "JSON data"
                    : block.content.substring(0, 100)}
                  {block.content.length > 100 && "..."}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Updated {block.lastUpdated} by {block.updatedBy}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="bg-card rounded-xl border border-border">
          {selectedBlock ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Edit Content</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedBlock.title}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Key</label>
                  <input
                    type="text"
                    value={selectedBlock.key}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Page</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    <option value="homepage">Homepage</option>
                    <option value="about">About</option>
                    <option value="contact">Contact</option>
                    <option value="packages">Packages</option>
                    <option value="flights">Flights</option>
                    <option value="hotels">Hotels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    <option value="text">Plain Text</option>
                    <option value="html">HTML</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={selectedBlock.type === "json"
                      ? JSON.stringify(JSON.parse(selectedBlock.content), null, 2)
                      : selectedBlock.content}
                    rows={10}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a content block to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
