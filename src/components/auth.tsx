"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LoaderCircle, LogIn, LogOut, User2Icon } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Profile from "./profile";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function AuthButton() {
  const [authStatus, setAuthStatus] = useState("loading");
  const { data: session, status } = useSession();

  const t = useTranslations("Auth");

  useEffect(() => {
    if (status === "authenticated") {
      setAuthStatus("authenticated");
    } else if (status === "unauthenticated") {
      setAuthStatus("unauthenticated");
    }
  }, [status]);

  if (authStatus === "loading") {
    return (
      <Button variant="outline" size="icon" className="size-8 flex items-center" disabled>
        <LoaderCircle className="h-[1.2rem] w-[1.2rem] animate-spin"/>
        {/* <User2Icon className="h-[1.2rem] w-[1.2rem] "/> */}
      </Button>
    );
  }

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild suppressHydrationWarning={true}>
          <Button variant="outline" size="icon" className="size-8 flex items-center">
            <User2Icon className="h-[1.2rem] w-[1.2rem]"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{session.user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Profile />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-[1.2rem] w-[1.2rem] ml-2"/>
            {t("sign-out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="icon" className="size-8 flex items-center" onClick={
      () => {
        setAuthStatus("loading");
        signIn("maps", { callbackUrl: "/" });
      }
    }>
      <LogIn className="h-[1.2rem] w-[1.2rem] "/>
    </Button>
  );
}
