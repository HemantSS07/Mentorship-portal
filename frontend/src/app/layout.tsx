import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MentorLink — Find Your Perfect College Mentor",
  description:
    "Connect with senior mentors for DSA, Web Dev, Placement Prep & more. Faster and more structured than WhatsApp groups.",
  keywords: "college mentor, placement prep, DSA help, coding mentorship, campus guidance",
  openGraph: {
    title: "MentorLink — College Mentorship Portal",
    description: "Find senior mentors for academic guidance and placement preparation.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ paddingTop: "var(--navbar-h, 56px)", minHeight: "100vh" }}>{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#13131f",
                color: "#f8fafc",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#6ee7b7", secondary: "#13131f" } },
              error: { iconTheme: { primary: "#fca5a5", secondary: "#13131f" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
