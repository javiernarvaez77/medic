import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the requesting user is a doctor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check doctor role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "doctor")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Solo médicos pueden buscar pacientes" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 3) {
      return new Response(JSON.stringify({ error: "Ingresa al menos 3 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get already assigned patient IDs
    const { data: assigned } = await adminClient
      .from("doctor_patients")
      .select("patient_id")
      .eq("doctor_id", user.id);

    const assignedIds = (assigned ?? []).map((a) => a.patient_id);

    // Search patients by document_id or name (only patients, not doctors)
    const { data: patientRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "patient");

    const patientUserIds = (patientRoles ?? []).map((r) => r.user_id);

    // Search profiles matching query
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, full_name, document_id, date_of_birth, programs")
      .in("user_id", patientUserIds)
      .or(`document_id.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    // Mark which are already assigned
    const results = (profiles ?? []).map((p) => ({
      ...p,
      already_assigned: assignedIds.includes(p.user_id),
    }));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
