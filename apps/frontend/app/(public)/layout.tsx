import PublicNavbar from '@/components/PublicNavbar';

export default function SecondLayerRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PublicNavbar />
      {children}
    </>
  );
}
