import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "./ui/button";
import { useTranslations } from "next-intl";

export default function Profile() {
  const { data: session, status } = useSession();
  const t = useTranslations("Profile");

  if (!session) {
    return redirect("/");
  }

  const user = session.user;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-[32px] p-[6px]">
          <User2Icon className="h-[1.2rem] w-[1.2rem] ml-2"/>
          {t("profile")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("profile")}</DialogTitle>
          <DialogDescription>
            {t("profile-description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="name-1">{t("name")}</Label>
            <Input id="name-1" name="name" value={user.name ?? ""} disabled />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email-1">{t("email")}</Label>
            <Input id="email-1" name="email" value={user.email ?? ""} disabled />
          </div>
        </div>
        <DialogFooter>
          <p className="text-sm text-zinc-500 italic mt-8">{t("read-only-info")}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
