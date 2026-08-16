import { Route, Routes } from "react-router-dom"

import { PublicLayout } from "@/components/layout/public-layout"
import { HomePage } from "@/pages/public/home-page"
import { LoginPage } from "@/pages/public/login-page"
import { RegisterPage } from "@/pages/public/register-page"
import { OrganizerHomePage } from "@/pages/organizer/organizer-home-page"
import { AdminHomePage } from "@/pages/admin/admin-home-page"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
        </Route>
        <Route path="/organizer" element={<OrganizerHomePage />} />
        <Route path="/admin" element={<AdminHomePage />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App
