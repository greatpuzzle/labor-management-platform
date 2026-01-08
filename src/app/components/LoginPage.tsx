import React, { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Lock, User } from "lucide-react"

interface LoginPageProps {
  onLogin: (user: { id: string; name: string; role: 'admin' | 'company'; companyId?: string }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (id === "greatpuzzle" && password === "128") {
      onLogin({
        id: "greatpuzzle",
        name: "본사관리자",
        role: "admin"
      })
    } else if (id === "globaltrade" && password === "999") {
      onLogin({
        id: "globaltrade",
        name: "글로벌트레이드 담당자",
        role: "company",
        companyId: "c4" // Matches the ID in ContractDashboard
      })
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <div className="w-12 h-12 bg-[#2E4F4F] rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
             </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#2E4F4F]">Great Puzzle</CardTitle>
          <CardDescription>
            계약 관리 시스템에 접속하기 위해 로그인해주세요.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">아이디</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="비밀번호를 입력하세요" 
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium text-center">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-[#2E4F4F] hover:bg-[#233b3b]">
              로그인
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
