import { Paintbrush } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Only the developer account has the `studio` flag, so only it ever renders this. */
export function StudioPanel() {
  return (
    <Card className="p-2">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Paintbrush size={18} className="text-purple-500" />
          <CardTitle className="text-base">Studio</CardTitle>
        </div>
        <CardDescription>
          Edit design details on your template sites. Every publish is a commit to the
          site&apos;s GitHub repo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a href="/studio" className={buttonVariants()}>
          Open Studio
        </a>
      </CardContent>
    </Card>
  );
}
