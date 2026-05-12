declare namespace Deno {
  const env: {
    get(name: string): string | undefined;
  };
}

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export * from "@supabase/supabase-js";
}
