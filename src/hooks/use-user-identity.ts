import { useEffect, useState } from "react";
import { useAuth } from "@/auth/auth-provider";
import { getProfile } from "@/lib/profile-service";

export interface UserIdentity {
  displayName: string;
  email: string;
  initials: string;
  isLoading: boolean;
}

const emptyIdentity: UserIdentity = { displayName: "", email: "", initials: "", isLoading: true };

function initialsFor(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  return (words[0]?.[0] ?? "").toUpperCase();
}

export function useUserIdentity(): UserIdentity {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<UserIdentity>(emptyIdentity);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIdentity({ displayName: "", email: "", initials: "", isLoading: false });
      return () => { active = false; };
    }

    const email = user.email ?? "";
    setIdentity({ displayName: email, email, initials: initialsFor(email), isLoading: true });
    void getProfile(user.id)
      .then((profile) => {
        if (!active) return;
        const displayName = profile?.full_name?.trim() || email;
        setIdentity({ displayName, email, initials: initialsFor(displayName || email), isLoading: false });
      })
      .catch(() => {
        if (active) setIdentity({ displayName: email, email, initials: initialsFor(email), isLoading: false });
      });

    return () => { active = false; };
  }, [user]);

  return identity;
}
