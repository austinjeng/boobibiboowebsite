"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  HAPPY_TAG_LABELS,
  HAPPY_TAG_COLORS,
  type HappyTag,
} from "@/lib/tags";
import { Award, LogOut, MapPin, Trophy } from "lucide-react";

interface CheckIn {
  id: string;
  note: string | null;
  happy_tags: string[];
  created_at: string;
  place_name: string;
}

interface Stats {
  totalCheckIns: number;
  placesVisited: number;
  completedLines: number;
}

const ACHIEVEMENT_BADGES = [
  { lines: 1, label: "初次連線", description: "完成第一條 Bingo 線" },
  { lines: 2, label: "雙線達人", description: "完成兩條 Bingo 線" },
  { lines: 3, label: "三線高手", description: "完成三條 Bingo 線" },
  { lines: 4, label: "四線勇者", description: "完成四條 Bingo 線" },
  { lines: 5, label: "五線王者", description: "完成五條 Bingo 線" },
];

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        fetch("/api/checkins").then((res) => res.json()),
        fetch("/api/bingo/current").then((res) => res.json()),
      ])
        .then(([checkInsData, bingoData]) => {
          setCheckIns(checkInsData.checkIns || []);

          // Calculate unique places
          const uniquePlaces = new Set(
            (checkInsData.checkIns || []).map(
              (c: CheckIn & { place_id: string }) => c.place_name
            )
          );

          setStats({
            totalCheckIns: checkInsData.checkIns?.length || 0,
            placesVisited: uniquePlaces.size,
            completedLines: bingoData.completedLines || 0,
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (isPending || loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!session?.user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <h1 className="text-xl font-bold">我的頁面</h1>
          <p className="mt-2 text-muted-foreground">登入以查看你的探索記錄</p>
          <Button asChild className="mt-4">
            <Link href="/auth/sign-in">登入</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const unlockedBadges = ACHIEVEMENT_BADGES.filter(
    (badge) => (stats?.completedLines || 0) >= badge.lines
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* User Info */}
        <Card className="mb-4">
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback className="text-xl">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{session.user.name}</h1>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {stats?.totalCheckIns || 0}
                </div>
                <div className="text-xs text-muted-foreground">打卡次數</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats?.placesVisited || 0}
                </div>
                <div className="text-xs text-muted-foreground">探索地點</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.completedLines || 0}
                </div>
                <div className="text-xs text-muted-foreground">Bingo 線</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              成就徽章
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                完成 Bingo 線以解鎖成就徽章
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unlockedBadges.map((badge) => (
                  <Badge
                    key={badge.lines}
                    className="gap-1 bg-amber-100 text-amber-800"
                  >
                    <Trophy className="h-3 w-3" />
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
            {/* Show next badge to unlock */}
            {(stats?.completedLines || 0) < 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                下一個徽章：完成{" "}
                {ACHIEVEMENT_BADGES.find(
                  (b) => b.lines > (stats?.completedLines || 0)
                )?.lines || 1}{" "}
                條線
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              最近打卡
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">還沒有打卡記錄</p>
            ) : (
              <div className="space-y-3">
                {checkIns.slice(0, 5).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{checkIn.place_name}</p>
                        {checkIn.note && (
                          <p className="text-sm text-muted-foreground">
                            "{checkIn.note}"
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(checkIn.created_at).toLocaleDateString(
                          "zh-TW"
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {checkIn.happy_tags?.map((tag) => {
                        const colors = HAPPY_TAG_COLORS[tag as HappyTag];
                        return (
                          <Badge
                            key={tag}
                            className={`text-xs ${colors?.bg || "bg-gray-100"} ${colors?.text || "text-gray-800"} border-0`}
                          >
                            {HAPPY_TAG_LABELS[tag as HappyTag] || tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </Button>
      </div>
    </AppLayout>
  );
}
