import "./globals.css";

import ThemeRegistry from "@/components/ThemeRegistry";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext"; // ✅ import your context
import { NotifyProvider } from "@/context/NotifyContext";
import { ProfileProvider } from "@/context/ProfileContext";



export const metadata = {
  title: "RoBio",
  description:
    "Creează și explorează arborele tău genealogic. Platformă dedicată pentru păstrarea și verificarea istoriei familiale în România.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body>
        <AuthProvider>
          <LanguageProvider>
            {" "}
            {/* ✅ Wrap here */}
            <NotifyProvider>
              <ProfileProvider>
                <ThemeRegistry>{children}</ThemeRegistry>
              </ProfileProvider>
            </NotifyProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
