"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SupabaseTest() {
  const [status, setStatus] = useState("Checking Supabase...");

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("projects")
      .select("id")
      .limit(1)
      .then(({ error }) => {
        if (error) {
          setStatus(`Connected, but database query failed: ${error.message}`);
          return;
        }

        setStatus("Supabase connection OK");
      });
  }, []);

  return (
    <div className="mt-8 rounded-lg border p-4">
      <p className="text-sm font-medium">
        Supabase Status
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  );
}