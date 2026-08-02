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
    const load = (initial = false) => {
      listDevFlowInquiries(status && status !== "ALL" ? status : undefined)
        .then((result) => {
          if (active) {
            setInquiries(result);
            setError("");
          }
        })
        .catch((nextError) => {
          if (active) {
            if (initial) setInquiries([]);
            setError(nextError instanceof Error ? nextError.message : String(nextError));
          }
        })
        .finally(() => { if (active && initial) setLoading(false); });
    };

    load(true);
    const intervalId = window.setInterval(() => load(false), 15_000);
    const refreshOnFocus = () => load(false);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [status]);

  return { inquiries, loading, error, refresh };
}
