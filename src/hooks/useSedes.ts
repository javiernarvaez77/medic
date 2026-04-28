import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Sede = {
  id: string;
  nombre: string;
  municipio: string;
  departamento: string;
  direccion: string | null;
  telefono: string | null;
};

export const useSedes = () => {
  return useQuery({
    queryKey: ["sedes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sedes" as any)
        .select("*")
        .order("departamento")
        .order("municipio")
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as unknown as Sede[];
    },
  });
};

/** Get unique departments from sedes list */
export const getDepartamentos = (sedes: Sede[]) =>
  [...new Set(sedes.map((s) => s.departamento))].sort();

/** Get unique municipalities for a department */
export const getMunicipios = (sedes: Sede[], departamento?: string) =>
  [...new Set(
    sedes
      .filter((s) => !departamento || s.departamento === departamento)
      .map((s) => s.municipio)
  )].sort();
