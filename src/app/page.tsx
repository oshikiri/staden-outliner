"use client";

import Link from "next/link";

export default function Home() {
  return (
    // RV: Provide a more descriptive link text for accessibility.
    <Link href={"/pages/" + encodeURIComponent("メインページ")}>
      メインページ
    </Link>
  );
}
