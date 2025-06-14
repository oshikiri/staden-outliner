"use client";

import Link from "next/link";

export default function Home() {
  return (
    <Link href={"/pages/" + encodeURIComponent("メインページ")}>
      メインページ
    </Link>
  );
}
