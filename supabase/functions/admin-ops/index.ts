import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const apiKey = req.headers.get("apikey") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const userClient = createClient(supabaseUrl, apiKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: settings } = await adminClient.from("settings").select("admin_email").limit(1).maybeSingle();
    const adminEmail = settings?.admin_email || "contact@maakirasoi.demo";

    if (userData.user.email !== adminEmail) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_customer_user") {
      const { email, password, customer_id, username, full_name } = body;

      const { data: existing } = await adminClient.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === email);

      let userId: string;

      if (found) {
        const { data: updated, error: updErr } = await adminClient.auth.admin.updateUserById(found.id, {
          password,
          email_confirm: true,
        });
        if (updErr) {
          return new Response(JSON.stringify({ error: updErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = found.id;
      } else {
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr) {
          return new Response(JSON.stringify({ error: createErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = newUser.user!.id;
      }

      const { error: custUpdErr } = await adminClient.from("customers")
        .update({ user_id: userId, password_plain: password })
        .eq("id", customer_id);

      if (custUpdErr) {
        return new Response(JSON.stringify({ error: custUpdErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Customer login created", user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_customer_password") {
      const { email, password, customer_id } = body;

      const { data: existing } = await adminClient.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === email);

      if (!found) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updErr } = await adminClient.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
      });

      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("customers")
        .update({ password_plain: password })
        .eq("id", customer_id);

      return new Response(JSON.stringify({ message: "Password reset" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_customer_user") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "No user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ message: "User deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
