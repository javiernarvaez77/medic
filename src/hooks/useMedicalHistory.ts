import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useHomeVisits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["home_visits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_visits")
        .select("*")
        .eq("user_id", user!.id)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddHomeVisit = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: {
      visitor_name: string;
      visit_date: string;
      reason?: string;
      observations?: string;
    }) => {
      const { error } = await supabase
        .from("home_visits")
        .insert({ ...visit, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home_visits"] }),
  });
};

export const useDeleteHomeVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home_visits"] }),
  });
};

export const useClinicalDocuments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clinical_documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_documents")
        .select("*")
        .eq("user_id", user!.id)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      // Mark unread docs as read
      await supabase
        .from("clinical_documents")
        .update({ read_by_patient: true } as any)
        .eq("user_id", user!.id)
        .eq("read_by_patient", false);
      return data;
    },
    enabled: !!user,
  });
};

export const useUploadClinicalDocument = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }) => {
      const filePath = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("clinical-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("clinical-documents")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("clinical_documents").insert({
        user_id: user!.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        description,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical_documents"] }),
  });
};

export const useDeleteClinicalDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      // Extract path from URL
      const urlParts = fileUrl.split("/clinical-documents/");
      if (urlParts.length > 1) {
        await supabase.storage.from("clinical-documents").remove([urlParts[1]]);
      }
      const { error } = await supabase.from("clinical_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical_documents"] }),
  });
};
