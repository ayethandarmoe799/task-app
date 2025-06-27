"use client";
import { ReactNode } from "react";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProviderWrapper>
      <Navbar />
      {children}
    </SessionProviderWrapper>
  );
} 