"use client";

import { useEffect, useState } from "react";
import {
  listDevFlowInquiries,
  type DevFlowInquiry,
  type DevFlowInquiryStatus,
} from "@/shared/api/devflow-api";

export function useDevFlowInquiries(status?: DevFlowInquiryStatus | "ALL") {
  const [inquiries, setInquiries] = useState<DevFlowInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setInquiries(await listDevFlowInquiries(status && status !== "ALL" ? status : undefined));
    } catch (nextError) {
      setInquiries([]);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listDevFlowInquiries(status && status !== "ALL" ? status : undefined)
      .then((result) => { if (active) setInquiries(result); })
      .catch((nextError) => { if (active) { setInquiries([]); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);

  return { inquiries, loading, error, refresh };
}
