import './globals.css';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme';

export const metadata = {
  title: 'RoBio',
  description: 'Creează și explorează arborele tău genealogic. Platformă dedicată pentru păstrarea și verificarea istoriei familiale în România.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
