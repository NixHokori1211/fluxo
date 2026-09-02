import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className="inline-block shrink-0 align-middle text-[#3B82F6]"
      fill="#3B82F6"
      stroke="white"
      aria-label="Verificado"
    />
  );
}
