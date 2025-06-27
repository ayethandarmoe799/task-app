"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-bold text-lg hover:text-blue-400">TaskApp</Link>
        {session && (
          <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        )}
        {session && (
          <Link href="/profile" className="hover:text-blue-400">Profile</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {status === "loading" ? null : session ? (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700 transition"
          >
            Sign Out
          </button>
        ) : (
          <>
            <Link href="/auth/signin" className="hover:text-blue-400">Sign In</Link>
            <Link href="/auth/register" className="hover:text-blue-400">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
} 