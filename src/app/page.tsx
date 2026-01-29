"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3X3, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface BingoSummary {
  completedCount: number;
  completedLines: number;
  totalTasks: number;
}

export default function Home() {
  const { data: session, isPending } = useSession();
  const [summary, setSummary] = useState<BingoSummary | null>(null);

  useEffect(() => {
    fetch("/api/bingo/current")
      .then((res) => res.json())
      .then((data) => {
        setSummary({
          completedCount: data.completedCount || 0,
          completedLines: data.completedLines || 0,
          totalTasks: data.tasks?.length || 25,
        });
      })
      .catch(console.error);
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">快樂探索 Bingo</h1>
          <p className="text-muted-foreground">情境避雷地圖</p>
          {!isPending && session?.user && (
            <p className="mt-2 text-sm">
              歡迎回來，{session.user.name || "探索者"}！
            </p>
          )}
        </div>

        {/* Weekly Progress Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">本週進度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {summary?.completedCount ?? "-"}
                </div>
                <div className="text-sm text-muted-foreground">完成格數</div>
              </div>
              <div className="border-l" />
              <div>
                <div className="text-3xl font-bold text-primary">
                  {summary?.completedLines ?? "-"}
                </div>
                <div className="text-sm text-muted-foreground">完成線數</div>
              </div>
            </div>
            {summary && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(summary.completedCount / summary.totalTasks) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {summary.completedCount} / {summary.totalTasks} 任務
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4">
          {session?.user ? (
            <Button asChild size="lg" className="h-14 text-lg">
              <Link href="/checkin">
                <Plus className="mr-2 h-5 w-5" />
                開始打卡
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-14 text-lg">
              <Link href="/auth/sign-in">登入開始探索</Link>
            </Button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline" size="lg" className="h-14">
              <Link href="/bingo">
                <Grid3X3 className="mr-2 h-5 w-5" />
                任務卡
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14">
              <Link href="/map">
                <MapPin className="mr-2 h-5 w-5" />
                探索地圖
              </Link>
            </Button>
          </div>
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!isPending && !session?.user && (
          <Card className="mt-6 border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                登入後可以儲存你的探索記錄、參與房間比拼
              </p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/auth/sign-in">使用 Google 登入</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
