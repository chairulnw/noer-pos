export type AdmissionType = "RAWAT_INAP" | "HOTEL";

export const admissionBase = (type: AdmissionType) => (type === "HOTEL" ? "/pet-hotel" : "/rawat-inap");
export const admissionLabel = (type: AdmissionType) => (type === "HOTEL" ? "Pet Hotel" : "Rawat Inap");
