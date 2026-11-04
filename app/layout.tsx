import "./globals.css";

export const metadata = {
  title: "KurtOCRAI - Görselden Metne",
  description: "Tarayıcı içi %100 yerel OCR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body style={{ backgroundColor: "#FDF6EC", color: "#2B2216" }}>
        {children}
      </body>
    </html>
  );
}
