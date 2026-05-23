import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from "@/utils/theme";
import "./globals.css";

const themeIds = THEMES.map(theme => theme.id);
const themeColors = Object.fromEntries(THEMES.map(theme => [theme.id, theme.themeColor]));
const defaultThemeColor = themeColors[DEFAULT_THEME];

const themeInitScript = `
(() => {
  try {
    const themeIds = ${JSON.stringify(themeIds)};
    const themeColors = ${JSON.stringify(themeColors)};
    const savedTheme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const theme = themeIds.includes(savedTheme) ? savedTheme : ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.setAttribute('data-theme', theme);

    const themeColor = themeColors[theme] || ${JSON.stringify(defaultThemeColor)};
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', themeColor);
  } catch {
    document.documentElement.setAttribute('data-theme', ${JSON.stringify(DEFAULT_THEME)});
  }
})();
`;

export const metadata: Metadata = {
  title: "BrainDump",
  applicationName: "BrainDump",
  description: "Stream your thoughts, stack your actions",
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/icon",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: defaultThemeColor },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
