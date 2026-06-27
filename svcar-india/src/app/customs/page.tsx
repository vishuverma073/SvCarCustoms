import type { Metadata } from "next";
import { CustomsExperience } from "@/components/customs/CustomsExperience";
import "./customs.css";

export const metadata: Metadata = {
  title: "SV Car Customs — Wraps, Performance & Custom Builds",
  description:
    "Premium car customisation: vinyl wraps, performance tuning, alloy wheels, ceramic detailing and full custom builds. Configure your wrap and book a build.",
  alternates: { canonical: "/customs" },
};

export default function CustomsPage() {
  return <CustomsExperience />;
}
