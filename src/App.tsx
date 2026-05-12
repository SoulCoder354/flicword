import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound.tsx";
import Home from "./pages/Home.tsx";
import SwipeWords from "./pages/SwipeWords.tsx";
import Difficulty from "./pages/Difficulty.tsx";
import Results from "./pages/Results.tsx";
import WordDetail from "./pages/WordDetail.tsx";
import Streaks from "./pages/Streaks.tsx";
import Achievements from "./pages/Achievements.tsx";
import WordsLibrary from "./pages/WordsLibrary.tsx";
import Profile from "./pages/Profile.tsx";
import QuizMode from "./pages/QuizMode.tsx";
import QuizDifficulty from "./pages/QuizDifficulty.tsx";
import QuizMCQ from "./pages/QuizMCQ.tsx";
import QuizSentence from "./pages/QuizSentence.tsx";
import QuizResults from "./pages/QuizResults.tsx";

import VerifyEmail from "./pages/VerifyEmail.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

const queryClient = new QueryClient();

const ThemeBoot = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return null;
};

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeBoot />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireName={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/home" element={<Protected><Home /></Protected>} />
            <Route path="/words" element={<Protected><WordsLibrary /></Protected>} />
            <Route path="/difficulty/:topic" element={<Protected><Difficulty /></Protected>} />
            <Route path="/swipe/:topic" element={<Protected><SwipeWords /></Protected>} />
            <Route path="/results" element={<Protected><Results /></Protected>} />
            <Route path="/word/:id" element={<Protected><WordDetail /></Protected>} />
            <Route path="/streaks" element={<Protected><Streaks /></Protected>} />
            <Route path="/achievements" element={<Protected><Achievements /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/quiz" element={<Protected><QuizMode /></Protected>} />
            <Route path="/quiz/difficulty/:mode" element={<Protected><QuizDifficulty /></Protected>} />
            <Route path="/quiz/mcq" element={<Protected><QuizMCQ /></Protected>} />
            <Route path="/quiz/sentence" element={<Protected><QuizSentence /></Protected>} />
            <Route path="/quiz/results" element={<Protected><QuizResults /></Protected>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
