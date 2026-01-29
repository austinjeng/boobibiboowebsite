"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Crown, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_image: string | null;
  completed_count: number;
  completed_lines: number;
}

interface RoomInfo {
  id: string;
  code: string;
  theme: string;
}

interface RoomMember {
  user_id: string;
  user_name: string;
  user_image: string | null;
  joined_at: string;
}

export default function RoomPage() {
  const { data: session, isPending } = useSession();
  const [joinCode, setJoinCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch room info if user has joined one (stored in localStorage for MVP)
  useEffect(() => {
    const savedCode = localStorage.getItem("roomCode");
    if (savedCode) {
      fetchRoomData(savedCode);
    }
  }, []);

  const fetchRoomData = async (code: string) => {
    setLoading(true);
    try {
      const [roomRes, leaderboardRes] = await Promise.all([
        fetch(`/api/rooms/${code}`),
        fetch(`/api/rooms/${code}/leaderboard`),
      ]);

      if (roomRes.ok) {
        const roomData = await roomRes.json();
        setCurrentRoom(roomData.room);
        setMembers(roomData.members);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard);
      }
    } catch (err) {
      console.error("Error fetching room:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setError(null);
    setLoading(true);

    try {
      // For MVP, use the default bingo card
      const bingoRes = await fetch("/api/bingo/current");
      const bingoData = await bingoRes.json();

      if (!bingoData.card) {
        setError("目前沒有可用的任務卡");
        return;
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bingoCardId: bingoData.card.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "無法建立房間");
      }

      const { room } = await res.json();
      localStorage.setItem("roomCode", room.code);
      fetchRoomData(room.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!joinCode.trim()) {
      setError("請輸入房間代碼");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "無法加入房間");
      }

      const { room } = await res.json();
      localStorage.setItem("roomCode", room.code);
      setJoinCode("");
      fetchRoomData(room.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("roomCode");
    setCurrentRoom(null);
    setMembers([]);
    setLeaderboard([]);
  };

  if (isPending) {
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
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">房間比拼</h1>
          <p className="mt-2 text-muted-foreground">
            登入後才能建立或加入房間
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/sign-in">登入</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">房間比拼</h1>

        {currentRoom ? (
          /* Room View */
          <div className="space-y-4">
            {/* Room Code Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{currentRoom.theme}</span>
                  <Badge variant="secondary">{members.length} 人</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">房間代碼</p>
                    <p className="text-2xl font-bold tracking-wider">
                      {currentRoom.code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "已複製" : "複製"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Leaderboard and Members */}
            <Tabs defaultValue="leaderboard">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leaderboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  排行榜
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="mr-2 h-4 w-4" />
                  成員
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    {leaderboard.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        還沒有人完成任務
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {leaderboard.map((entry, index) => (
                          <div
                            key={entry.user_id}
                            className="flex items-center gap-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center">
                              {index === 0 ? (
                                <Crown className="h-5 w-5 text-amber-500" />
                              ) : (
                                <span className="text-lg font-bold text-muted-foreground">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={entry.user_image || undefined}
                              />
                              <AvatarFallback>
                                {entry.user_name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{entry.user_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {entry.completed_count} 格
                              </p>
                              {entry.completed_lines > 0 && (
                                <p className="text-xs text-amber-600">
                                  {entry.completed_lines} 線
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.user_image || undefined}
                            />
                            <AvatarFallback>
                              {member.user_name?.charAt(0).toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{member.user_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Leave Room */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLeaveRoom}
            >
              離開房間
            </Button>
          </div>
        ) : (
          /* Join/Create Room View */
          <div className="space-y-4">
            {/* Create Room */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">建立新房間</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  建立一個房間，邀請朋友一起比拼 Bingo 進度
                </p>
                <Button
                  className="w-full"
                  onClick={handleCreateRoom}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  建立房間
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">加入房間</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinRoom} className="space-y-3">
                  <Input
                    placeholder="輸入房間代碼"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase())
                    }
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    加入房間
                  </Button>
                </form>
              </CardContent>
            </Card>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
