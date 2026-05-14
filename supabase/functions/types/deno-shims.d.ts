declare namespace Deno {
  const env: {
    get(name: string): string | undefined;
  };
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export * from "@supabase/supabase-js";
}
