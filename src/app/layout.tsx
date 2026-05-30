import "./globals.css";
import "leaflet/dist/leaflet.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotifyProvider } from "@/context/NotifyContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { UploadsProvider } from "@/context/UploadContext";

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
            <NotifyProvider>
              <ProfileProvider>
                <UploadsProvider>
                  <ThemeRegistry>{children}</ThemeRegistry>
                </UploadsProvider>
              </ProfileProvider>
            </NotifyProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}