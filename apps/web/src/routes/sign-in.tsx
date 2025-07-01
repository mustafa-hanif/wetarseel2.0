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
import { Loader2, Key } from "lucide-solid";
import { useForm } from "@/lib/validation";
import { createFileRoute, useRouter } from "@tanstack/solid-router";
import { createEffect, createSignal } from "solid-js";
import { authClient, signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});

function SignIn() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [rememberMe, setRememberMe] = createSignal(false);
  const session = authClient.useSession();
  const router = useRouter();
  createEffect(() => {
    const sessionData = session();
    if (sessionData.data && sessionData.data.user) {
      router.history.push("/");
    }
    console.log("Session", JSON.stringify(session(), null, 2));
  });
  const { validate, formSubmit, errors } = useForm({
    errorClass: "error-input",
  });

  const fn = async (form: any) => {
    // form.submit()
    console.log("Done");

    const response = await signIn.email(
      {
        email: email(),
        password: password(),
      },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          setLoading(false);
        },
      }
    );
  };
  return (
    <div class="flex justify-center py-4 w-full">
      <Card class="max-w-md shrink-0">
        <CardHeader>
          <CardTitle class="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription class="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form use:formSubmit={fn}>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <label for="email">Email</label>
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
                    Forgot your password?
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
                {loading() ? (
                  <Loader2 size={16} class="animate-spin" />
                ) : (
                  <p> Login </p>
                )}
              </Button>

              <div class="w-full gap-2 flex items-center justify-between flex-col">
                <Button
                  variant="outline"
                  class="w-full gap-2"
                  disabled={loading()}
                  onClick={async () => {
                    await signIn.social(
                      {
                        provider: "google",
                        callbackURL: "/dashboard",
                      },
                      {
                        onRequest: (ctx) => {
                          setLoading(true);
                        },
                        onResponse: (ctx) => {
                          setLoading(false);
                        },
                      }
                    );
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="0.98em"
                    height="1em"
                    viewBox="0 0 256 262"
                  >
                    <path
                      fill="#4285F4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                    ></path>
                    <path
                      fill="#EB4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    ></path>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div class="flex justify-center w-full border-t py-4">
            <p class="text-center text-xs text-neutral-500">
              built with{" "}
              <a
                href="https://better-auth.com"
                class="underline"
                target="_blank"
              >
                <span class="dark:text-white/70 cursor-pointer">
                  better-auth.
                </span>
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
