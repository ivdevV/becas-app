export type ScholarshipDocument = {
  id: string;
  label: string;
  helpText?: string;
};

export type Scholarship = {
  id: string;
  name: string;
  maxDiscount: string;
  category: "academica" | "profesional" | "internacional" | "socioeconomica";
  summary: string;
  profile: string;
  documents: ScholarshipDocument[];
};

const curriculumDocument: ScholarshipDocument = {
  id: "curriculum-vitae",
  label: "Curriculum Vitae",
  helpText: "Documento actualizado con tu trayectoria academica y profesional.",
};

export const scholarships: Scholarship[] = [
  {
    id: "merito-academico",
    name: "Beca Merito Academico",
    maxDiscount: "Hasta 35%",
    category: "academica",
    summary: "Expediente academico destacado.",
    profile: "Pensada para candidatos con resultados academicos sobresalientes.",
    documents: [
      curriculumDocument,
      {
        id: "expediente-academico-compulsado",
        label: "Expediente Academico Compulsado",
        helpText: "Debe permitir verificar tu rendimiento academico.",
      },
      {
        id: "publicaciones-academicas",
        label: "Articulos o publicaciones academicas, si corresponde",
        helpText: "Aportalo solo si suma evidencia a tu perfil academico.",
      },
    ],
  },
  {
    id: "experto",
    name: "Beca Experto",
    maxDiscount: "Hasta 15%",
    category: "profesional",
    summary: "Profesionales con experiencia laboral relevante.",
    profile: "Orientada a personas que ya cuentan con trayectoria profesional relacionada.",
    documents: [
      curriculumDocument,
      {
        id: "expediente-laboral-certificado-profesional",
        label: "Expediente laboral o certificado profesional",
      },
      {
        id: "recomendacion-vida-laboral",
        label: "Carta de recomendacion o certificado de vida laboral",
      },
    ],
  },
  {
    id: "estudiantes-globales",
    name: "Beca Estudiantes Globales",
    maxDiscount: "Hasta 20%",
    category: "internacional",
    summary: "Estudiantes internacionales fuera de Espana.",
    profile: "Prevista para candidatos que estudian desde otro pais.",
    documents: [curriculumDocument],
  },
  {
    id: "apoyo-familiar",
    name: "Beca Apoyo Familiar",
    maxDiscount: "Hasta 30%",
    category: "socioeconomica",
    summary: "Familias monoparentales o numerosas.",
    profile: "Dirigida a estudiantes cuya situacion familiar requiere apoyo economico.",
    documents: [
      curriculumDocument,
      {
        id: "acreditacion-familia",
        label: "Acreditacion de familia monoparental o numerosa",
      },
      {
        id: "situacion-economica",
        label: "Documentacion que justifique la situacion economica",
      },
    ],
  },
  {
    id: "emprendedores",
    name: "Beca Emprendedores",
    maxDiscount: "Hasta 15%",
    category: "socioeconomica",
    summary: "Jovenes emprendedores menores de 35 anos.",
    profile: "Para candidatos con proyectos emprendidos o actividad emprendedora demostrable.",
    documents: [
      curriculumDocument,
      {
        id: "documentacion-proyecto-emprendido",
        label: "Certificado o documentacion del proyecto emprendido",
      },
    ],
  },
  {
    id: "desocupacion",
    name: "Beca Desocupacion",
    maxDiscount: "Hasta 20%",
    category: "socioeconomica",
    summary: "Situacion de desempleo o ERTE.",
    profile: "Para personas que necesitan apoyo por situacion laboral actual.",
    documents: [
      curriculumDocument,
      {
        id: "certificado-desempleo-erte",
        label: "Certificado oficial de desempleo o ERTE",
      },
    ],
  },
  {
    id: "diversidad-capaz",
    name: "Beca Diversidad Capaz",
    maxDiscount: "Hasta 30%",
    category: "socioeconomica",
    summary: "Discapacidad reconocida igual o superior al 33%.",
    profile: "Para estudiantes con certificado oficial de discapacidad reconocido.",
    documents: [
      curriculumDocument,
      {
        id: "certificado-discapacidad",
        label: "Certificado oficial de discapacidad",
      },
    ],
  },
  {
    id: "compromiso-social",
    name: "Beca Compromiso Social",
    maxDiscount: "Hasta 20%",
    category: "socioeconomica",
    summary: "Colaboracion en proyectos sociales.",
    profile: "Para candidatos con participacion acreditada en ONG o proyectos sociales.",
    documents: [
      curriculumDocument,
      {
        id: "certificado-colaboracion-social",
        label: "Certificado de colaboracion en ONG o proyecto social",
      },
    ],
  },
];

export const allowedFileExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"] as const;

export const maxFileSizeBytes = 10 * 1024 * 1024;

export function findScholarship(id: string) {
  return scholarships.find((scholarship) => scholarship.id === id);
}

export function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export function isAllowedFile(filename: string) {
  return allowedFileExtensions.includes(
    getFileExtension(filename) as (typeof allowedFileExtensions)[number],
  );
}