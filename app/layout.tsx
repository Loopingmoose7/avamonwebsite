import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AP World Practice",
  description: "AP World History practice questions by unit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
