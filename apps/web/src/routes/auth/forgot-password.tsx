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

export const Route = createFileRoute("/auth/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [rememberMe, setRememberMe] = createSignal(false);
  const [error, setError] = createSignal("");
  const router = useRouter();

  const data = useAuth();

  const { validate, formSubmit, errors } = useForm({
    errorClass: "error-input",
  });

  const fn = async (form: any) => {
    const { data, error } = await authClient.requestPasswordReset({
      email: email(),
      redirectTo: "/auth/reset-password",
    });

    if (error) {
      setError(error.message || "An error occurred during reset password.");
      return;
    }
    router.history.push("/");
  };

  return (
    <div class="flex justify-center py-4 w-full">
      <Card class="max-w-md shrink-0">
        <CardHeader>
          <CardTitle class="text-lg md:text-xl">Forgot Password</CardTitle>
          <CardDescription class="text-xs md:text-sm">
            Enter your email below to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form use:formSubmit={fn}>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <label for="email">Email </label>
                <TextFieldRoot>
                  <TextField
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    value={email()}
                  />
                </TextFieldRoot>
              </div>

              <div class="grid gap-2">
                <div class="flex items-center">
                  <label for="password">Password</label>
                  <div class="ml-auto inline-block text-sm underline">
                    <Link to="/auth/forgot-password">
                      Forgot your password?
                    </Link>
                  </div>
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

              <div class="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  onClick={() => {
                    setRememberMe(!rememberMe);
                  }}
                />
                <label for="remember">Remember me</label>
              </div>

              <Button type="submit" class="w-full" disabled={loading()}>
                {loading() || data.isPending ? (
                  <Loader2 size={16} class="animate-spin" />
                ) : (
                  <p> Login </p>
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
