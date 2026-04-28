import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is a doctor or admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoles = (roles ?? []).map((r: any) => r.role);
    if (!callerRoles.includes("doctor") && !callerRoles.includes("admin")) {
      return new Response(JSON.stringify({ error: "No tienes permisos para crear pacientes" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { full_name, document_id, phone, date_of_birth, gender, eps, programs, sede_id, assign_to_me } = body;

    if (!full_name || !document_id) {
      return new Response(JSON.stringify({ error: "Nombre y documento son obligatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if document_id already exists in profiles
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name")
      .eq("document_id", document_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: `Ya existe un paciente con este documento: ${existing.full_name}` 
      }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user with admin API (no email verification needed)
    // Use document_id as a fake email for the auth system
    const fakeEmail = `patient_${document_id}@kronic.internal`;
    const tempPassword = `Kronic_${document_id.slice(-4)}!`;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm since there's no real email
      user_metadata: {
        full_name,
        phone: phone || null,
        role: "patient",
        sede_id: sede_id || null,
        assisted_registration: true,
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUser.user.id;

    // Update profile with additional data (trigger already created basic profile)
    const profileUpdate: Record<string, any> = {};
    if (document_id) profileUpdate.document_id = document_id;
    if (phone) profileUpdate.phone = phone;
    if (date_of_birth) profileUpdate.date_of_birth = date_of_birth;
    if (gender) profileUpdate.gender = gender;
    if (eps) profileUpdate.eps = eps;
    if (programs) profileUpdate.programs = Array.isArray(programs) ? programs : [programs];
    if (sede_id) profileUpdate.sede_id = sede_id;

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", newUserId);
    }

    // Auto-assign to the calling doctor if requested
    if (assign_to_me && callerRoles.includes("doctor")) {
      await supabaseAdmin.from("doctor_patients").insert({
        doctor_id: caller.id,
        patient_id: newUserId,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUserId,
      temp_password: tempPassword,
      document_id,
      message: "Paciente creado exitosamente" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
