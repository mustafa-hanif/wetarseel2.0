import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";

import { Checkbox } from "@/components/ui/checkbox";
import Loader2 from "lucide-solid/icons/loader-2";
import { useForm } from "@/lib/validation";
import { createFileRoute, Link, useRouter } from "@tanstack/solid-router";
import { createEffect, createSignal, Show } from "solid-js";
import { authClient, signIn } from "@/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/reset-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const router = useRouter();

  const data = useAuth();

  const { validate, formSubmit, errors } = useForm({
    errorClass: "error-input",
  });

  const fn = async (form: any) => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      // Handle the error
      setError("Invalid or missing token.");
      return;
    }
    setLoading(true);
    const { data, error } = await authClient.resetPassword({
      newPassword: password(),
      token,
    });
    if (error) {
      setError(error.message || "An error occurred during password reset.");
      setLoading(false);
      return;
    }
    setLoading(false);

    router.history.push("/");
  };

  return (
    <div class="flex justify-center py-4 w-full">
      <Card class="max-w-md shrink-0">
        <CardHeader>
          <CardTitle class="text-lg md:text-xl">Reset Password</CardTitle>
          <CardDescription class="text-xs md:text-sm">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form use:formSubmit={fn}>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <div class="flex items-center">
                  <label for="password">Password</label>
                </div>

                <TextFieldRoot>
                  <TextField
                    id="password"
                    type="password"
                    placeholder="password"
                    autocomplete="password"
                    value={password()}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </TextFieldRoot>
              </div>

              <Button type="submit" class="w-full" disabled={loading()}>
                {loading() || data.isPending ? (
                  <Loader2 size={16} class="animate-spin" />
                ) : (
                  <p>Save</p>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Show when={error() !== ""}>
            <div class="flex justify-center w-full border-t py-4 text-red-800">
              {error()}
            </div>
          </Show>
        </CardFooter>
      </Card>
    </div>
  );
}
