import * as React from "react"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { LockKeyhole, User, FlaskConical } from "lucide-react"

interface LoginProps {
  onLogin: (id: string, pw: string) => void
  onSimulateInvite: () => void
}

export function Login({ onLogin, onSimulateInvite }: LoginProps) {
  const [id, setId] = React.useState("")
  const [pw, setPw] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !pw) {
      setError("아이디와 비밀번호를 모두 입력해주세요.")
      return
    }
    onLogin(id, pw)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2E4F4F]">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#2E4F4F]">
              Great Puzzle
            </CardTitle>
            <CardDescription>
              근로자 계약 관리 시스템에 로그인하세요
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">아이디</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="id"
                    placeholder="아이디를 입력하세요"
                    className="pl-9"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    className="pl-9"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                  <p className="text-sm text-red-500 font-medium text-center animate-in fade-in slide-in-from-top-1">{error}</p>
              )}
            </CardContent>
            <CardFooter className="pt-4">
              <Button type="submit" className="w-full bg-[#2E4F4F] hover:bg-[#233d3d] h-11 text-base">
                로그인
              </Button>
            </CardFooter>
          </form>
          <div className="pb-6 text-center text-xs text-slate-400">
             © 2026 Great Puzzle Corp. All rights reserved.
          </div>
        </Card>

        {/* Developer Tool for Testing Invite */}
        <div className="text-center">
           <p className="text-xs text-slate-500 mb-2">―― Developer Tools ――</p>
           <Button 
             variant="outline" 
             className="bg-white/50 border-dashed text-slate-600 hover:bg-white hover:text-[#2E4F4F]"
             onClick={onSimulateInvite}
           >
             <FlaskConical className="mr-2 h-4 w-4" />
             초대 링크 접속 시뮬레이션
           </Button>
        </div>
      </div>
    </div>
  )
}
