"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  HAPPY_TAGS,
  HAPPY_TAG_LABELS,
  HAPPY_TAG_COLORS,
  CAUTION_TAG_LABELS,
  type HappyTag,
} from "@/lib/tags";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Filter, Search, X } from "lucide-react";

// Dynamic import for Leaflet (client-side only)
const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

interface MapPoint {
  place_id: string;
  place_name: string;
  lat: number;
  lng: number;
  check_in_count: number;
  happy_tags: string[];
  latest_note: string | null;
  latest_photo_url: string | null;
  cautions: string[];
}

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<HappyTag | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCautions, setShowCautions] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedTag) params.set("happyTag", selectedTag);

    fetch(`/api/map/points?${params}`)
      .then((res) => res.json())
      .then((data) => setPoints(data.points || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, selectedTag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered by useEffect
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Search and Filters */}
        <div className="border-b bg-background p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜尋地點..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </form>

          {/* Tag Filters */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">依快樂標籤篩選</p>
              <div className="flex flex-wrap gap-2">
                {HAPPY_TAGS.map((tag) => {
                  const isSelected = selectedTag === tag;
                  const colors = HAPPY_TAG_COLORS[tag];
                  return (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? `${colors.bg} ${colors.text} border-transparent`
                          : "hover:bg-muted"
                      )}
                      onClick={() =>
                        setSelectedTag(isSelected ? null : tag)
                      }
                    >
                      {HAPPY_TAG_LABELS[tag]}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <MapComponent
              points={points}
              onPointSelect={setSelectedPoint}
              selectedPoint={selectedPoint}
            />
          )}
        </div>

        {/* Selected Point Card */}
        {selectedPoint && (
          <Card className="absolute bottom-20 left-4 right-4 z-[1000] mx-auto max-w-lg shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  {selectedPoint.place_name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedPoint(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Happy Tags - Primary display */}
              <div className="flex flex-wrap gap-1">
                {selectedPoint.happy_tags?.map((tag) => {
                  const colors =
                    HAPPY_TAG_COLORS[tag as HappyTag] || {
                      bg: "bg-gray-100",
                      text: "text-gray-800",
                    };
                  return (
                    <Badge
                      key={tag}
                      className={`${colors.bg} ${colors.text} border-0`}
                    >
                      {HAPPY_TAG_LABELS[tag as HappyTag] || tag}
                    </Badge>
                  );
                })}
              </div>

              {/* Note */}
              {selectedPoint.latest_note && (
                <p className="text-sm text-muted-foreground">
                  &ldquo;{selectedPoint.latest_note}&rdquo;
                </p>
              )}

              {/* Cautions - Collapsed by default */}
              {selectedPoint.cautions?.length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCautions(!showCautions)}
                  >
                    注意事項
                    {showCautions ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {showCautions && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedPoint.cautions.map((caution) => (
                        <Badge
                          key={caution}
                          variant="outline"
                          className="text-xs"
                        >
                          {CAUTION_TAG_LABELS[
                            caution as keyof typeof CAUTION_TAG_LABELS
                          ] || caution}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                打卡 {selectedPoint.check_in_count} 次
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Card className="mx-4 max-w-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">還沒有打卡記錄</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  開始探索並打卡，你的回憶地圖將會在這裡顯示
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
