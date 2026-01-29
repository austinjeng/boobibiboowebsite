"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Trophy } from "lucide-react";

interface BingoTask {
  id: string;
  bingo_card_id: string;
  task_index: number;
  title: string;
  rule: string | null;
}

interface BingoCompletion {
  bingo_task_id: string;
  check_in_id: string;
  completed_at: string;
}

interface BingoData {
  card: { id: string; theme: string; week_start_date: string } | null;
  tasks: BingoTask[];
  completions: BingoCompletion[];
  completedCount: number;
  completedLines: number;
}

// Default tasks for MVP (fallback if no database)
const DEFAULT_TASKS = [
  "去一個沒去過的街區散步 20 分鐘",
  "找到一個光線很好的拍照點",
  "吃到一樣你們都覺得滿分的東西",
  "找到一個能坐超過 1 小時不趕人的地方",
  "收集一張你們最喜歡的街景照",
  "找到一間氣氛很舒服的店",
  "發現一個你們想回訪的地點",
  "嘗試一個你們平常不會點的品項",
  "找到一個適合聊天的座位環境",
  "今天的店用 3 個詞形容它",
  "收集一個「意外很喜歡」的小驚喜",
  "用 100 字寫下今天最快樂的瞬間",
  "找到一個你們會想帶朋友去的地方",
  "做一次角色互換：你選地點/我選餐點",
  "找到一個讓你們覺得「很療癒」的角落",
  "收集一個「安靜」標籤地點",
  "收集一個「拍照好看」標籤地點",
  "收集一個「甜點值得」標籤地點",
  "收集一個「散步順路」標籤地點",
  "今日 MVP 地點投票（並留下原因）",
  "找到一個「CP 值很好」的選擇",
  "找到一個「你們想二刷」的店/景點",
  "兩人各拍一張今天最滿意的照片",
  "打卡一個「讓人心情變好」的地方",
  "完成一條 Bingo 線（任意五格）",
];

function calculateCompletedLines(completedIndices: Set<number>): {
  lines: number;
  winningIndices: Set<number>;
} {
  const winningIndices = new Set<number>();
  let lines = 0;

  // Check rows
  for (let row = 0; row < 5; row++) {
    let rowComplete = true;
    for (let col = 0; col < 5; col++) {
      if (!completedIndices.has(row * 5 + col)) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) {
      lines++;
      for (let col = 0; col < 5; col++) {
        winningIndices.add(row * 5 + col);
      }
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    let colComplete = true;
    for (let row = 0; row < 5; row++) {
      if (!completedIndices.has(row * 5 + col)) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      lines++;
      for (let row = 0; row < 5; row++) {
        winningIndices.add(row * 5 + col);
      }
    }
  }

  // Check diagonals
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!completedIndices.has(i * 5 + i)) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) {
    lines++;
    for (let i = 0; i < 5; i++) {
      winningIndices.add(i * 5 + i);
    }
  }

  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    if (!completedIndices.has(i * 5 + (4 - i))) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) {
    lines++;
    for (let i = 0; i < 5; i++) {
      winningIndices.add(i * 5 + (4 - i));
    }
  }

  return { lines, winningIndices };
}

export default function BingoPage() {
  const [data, setData] = useState<BingoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bingo/current")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tasks = data?.tasks?.length
    ? data.tasks
    : DEFAULT_TASKS.map((title, i) => ({
        id: `default-${i}`,
        bingo_card_id: "default",
        task_index: i,
        title,
        rule: null,
      }));

  const completedTaskIds = new Set(
    data?.completions?.map((c) => c.bingo_task_id) || []
  );
  const completedIndices = new Set(
    tasks.filter((t) => completedTaskIds.has(t.id)).map((t) => t.task_index)
  );
  const { lines, winningIndices } = calculateCompletedLines(completedIndices);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {data?.card?.theme || "快樂探索"} Bingo
            </h1>
            <p className="text-sm text-muted-foreground">點擊任務開始打卡</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {completedIndices.size}/25
            </Badge>
            {lines > 0 && (
              <Badge className="gap-1 bg-amber-500">
                <Trophy className="h-3 w-3" />
                {lines} 線
              </Badge>
            )}
          </div>
        </div>

        {/* Bingo Grid */}
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-5 gap-1">
              {tasks
                .sort((a, b) => a.task_index - b.task_index)
                .map((task) => {
                  const isCompleted = completedTaskIds.has(task.id);
                  const isWinning = winningIndices.has(task.task_index);

                  return (
                    <Link
                      key={task.id}
                      href={
                        isCompleted
                          ? "#"
                          : `/checkin?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`
                      }
                      className={cn(
                        "relative aspect-square rounded-md p-1 text-center transition-all",
                        "flex flex-col items-center justify-center",
                        isCompleted
                          ? isWinning
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                          : "bg-muted hover:bg-muted/80 hover:ring-2 hover:ring-primary",
                        !isCompleted && "cursor-pointer"
                      )}
                    >
                      {isCompleted && (
                        <div className="absolute right-1 top-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <span className="line-clamp-3 text-[10px] leading-tight sm:text-xs">
                        {task.title}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">完成進度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>任務完成</span>
                <span className="font-medium">
                  {completedIndices.size} / 25
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(completedIndices.size / 25) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Bingo 線數</span>
                <span className="font-medium">{lines} 線</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
