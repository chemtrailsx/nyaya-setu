import { redirect } from "next/navigation";

// The deployed app opens straight on the tool — reviewers see only the demo.
// The marketing/landing content lives in the pitch deck, not the app.
export default function Home() {
  redirect("/demo");
}
