import "./globals.css";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body      >
      <div className="bg-black">
          {children}
        </div>
      </body>
    </html>
  );
}
