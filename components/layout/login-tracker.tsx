"use client";

import { useEffect } from "react";
import { recordLoginEvent } from "@/app/actions/activity";

const LOGIN_TRACKED_KEY = "ca_login_tracked";

export function LoginTracker() {
  useEffect(() => {
    if (sessionStorage.getItem(LOGIN_TRACKED_KEY)) return;

    void recordLoginEvent().then(() => {
      sessionStorage.setItem(LOGIN_TRACKED_KEY, "1");
    });
  }, []);

  return null;
}
