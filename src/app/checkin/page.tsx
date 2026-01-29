"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  HAPPY_TAGS,
  CAUTION_TAGS,
  CONTEXT_TAGS,
  HAPPY_TAG_LABELS,
  CAUTION_TAG_LABELS,
  CONTEXT_TAG_LABELS,
  HAPPY_TAG_COLORS,
  type HappyTag,
  type CautionTag,
  type ContextTag,
} from "@/lib/tags";
import { ChevronDown, ChevronUp, MapPin, Send } from "lucide-react";

function CheckInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const taskTitle = searchParams.get("taskTitle");

  const [placeName, setPlaceName] = useState("");
  const [placeLat, setPlaceLat] = useState<number | null>(null);
  const [placeLng, setPlaceLng] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [selectedHappyTags, setSelectedHappyTags] = useState<HappyTag[]>([]);
  const [selectedCautions, setSelectedCautions] = useState<CautionTag[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<ContextTag[]>([]);
  const [showCautions, setShowCautions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const toggleHappyTag = (tag: HappyTag) => {
    setSelectedHappyTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCaution = (tag: CautionTag) => {
    setSelectedCautions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleContext = (tag: ContextTag) => {
    setSelectedContexts((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPlaceLat(position.coords.latitude);
          setPlaceLng(position.coords.longitude);
          setGettingLocation(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("無法取得位置，請手動輸入");
          setGettingLocation(false);
        }
      );
    } else {
      setError("您的瀏覽器不支援定位功能");
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!placeName.trim()) {
      setError("請輸入地點名稱");
      return;
    }

    if (selectedHappyTags.length === 0) {
      setError("請至少選擇一個快樂標籤");
      return;
    }

    if (!note.trim()) {
      setError("請輸入一句話心得");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create place first
      const placeRes = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: placeName.trim(),
          lat: placeLat || 25.033, // Default to Taipei if no location
          lng: placeLng || 121.5654,
        }),
      });

      if (!placeRes.ok) {
        const data = await placeRes.json();
        throw new Error(data.error || "無法建立地點");
      }

      const { place } = await placeRes.json();

      // Create check-in
      const checkInRes = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: place.id,
          note: note.trim(),
          happyTags: selectedHappyTags,
          cautions: selectedCautions,
          contexts: selectedContexts,
        }),
      });

      if (!checkInRes.ok) {
        const data = await checkInRes.json();
        throw new Error(data.error || "無法完成打卡");
      }

      const { checkIn } = await checkInRes.json();

      // If from bingo task, complete it
      if (taskId) {
        await fetch("/api/bingo/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            checkInId: checkIn.id,
          }),
        });
      }

      // Navigate back with success
      router.push(taskId ? "/bingo?success=1" : "/?success=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">打卡記錄</h1>

        {taskTitle && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">正在完成任務</p>
              <p className="font-medium">{taskTitle}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Place Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                地點
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="輸入地點名稱"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? "取得中..." : "取得目前位置"}
              </Button>
              {placeLat && placeLng && (
                <p className="text-xs text-muted-foreground">
                  位置: {placeLat.toFixed(4)}, {placeLng.toFixed(4)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Happy Tags - Primary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                快樂標籤 <span className="text-destructive">*</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                至少選擇一個（必填）
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {HAPPY_TAGS.map((tag) => {
                  const isSelected = selectedHappyTags.includes(tag);
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
                      onClick={() => toggleHappyTag(tag)}
                    >
                      {HAPPY_TAG_LABELS[tag]}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Note Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                一句話心得 <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="今天最快樂的是..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Context Tags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">情境標籤</CardTitle>
              <p className="text-xs text-muted-foreground">選填</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_TAGS.map((tag) => {
                  const isSelected = selectedContexts.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleContext(tag)}
                    >
                      {CONTEXT_TAG_LABELS[tag]}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cautions - Collapsed */}
          <Card>
            <CardHeader
              className="cursor-pointer pb-2"
              onClick={() => setShowCautions(!showCautions)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">注意事項</span>
                {showCautions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                選填，幫助其他人避雷
              </p>
            </CardHeader>
            {showCautions && (
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CAUTION_TAGS.map((tag) => {
                    const isSelected = selectedCautions.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected
                            ? "bg-neutral-200 text-neutral-700"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleCaution(tag)}
                      >
                        {CAUTION_TAG_LABELS[tag]}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Error Message */}
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "送出中..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                完成打卡
              </>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </AppLayout>
      }
    >
      <CheckInForm />
    </Suspense>
  );
}
