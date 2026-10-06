-- Manual: dibutuhkan index GIN trigram untuk pencarian ILIKE %teks%
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "admission_patient_id_idx" ON "admission"("patient_id");

-- CreateIndex
CREATE INDEX "admission_status_type_idx" ON "admission"("status", "type");

-- CreateIndex
CREATE INDEX "admission_log_admission_id_idx" ON "admission_log"("admission_id");

-- CreateIndex
CREATE INDEX "appointment_patient_id_idx" ON "appointment"("patient_id");

-- CreateIndex
CREATE INDEX "attachment_record_id_idx" ON "attachment"("record_id");

-- CreateIndex
CREATE INDEX "attachment_examination_id_idx" ON "attachment"("examination_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_created_at_idx" ON "audit_log"("entity", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "grooming_patient_id_idx" ON "grooming"("patient_id");

-- CreateIndex
CREATE INDEX "invoice_status_finalized_at_idx" ON "invoice"("status", "finalized_at");

-- CreateIndex
CREATE INDEX "invoice_status_created_at_idx" ON "invoice"("status", "created_at");

-- CreateIndex
CREATE INDEX "invoice_owner_id_idx" ON "invoice"("owner_id");

-- CreateIndex
CREATE INDEX "invoice_created_at_idx" ON "invoice"("created_at");

-- CreateIndex
CREATE INDEX "invoice_no_trgm_idx" ON "invoice" USING GIN ("invoice_no" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "invoice_customer_name_trgm_idx" ON "invoice" USING GIN ("customer_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "invoice_item_invoice_id_idx" ON "invoice_item"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_item_item_id_idx" ON "invoice_item"("item_id");

-- CreateIndex
CREATE INDEX "item_name_trgm_idx" ON "item" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "opname_item_opname_id_idx" ON "opname_item"("opname_id");

-- CreateIndex
CREATE INDEX "owner_whatsapp_trgm_idx" ON "owner" USING GIN ("whatsapp" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "owner_name_trgm_idx" ON "owner" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "patient_owner_id_idx" ON "patient"("owner_id");

-- CreateIndex
CREATE INDEX "patient_name_trgm_idx" ON "patient" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "payment_invoice_id_idx" ON "payment"("invoice_id");

-- CreateIndex
CREATE INDEX "payment_paid_at_idx" ON "payment"("paid_at");

-- CreateIndex
CREATE INDEX "prescription_item_record_id_idx" ON "prescription_item"("record_id");

-- CreateIndex
CREATE INDEX "record_addendum_record_id_idx" ON "record_addendum"("record_id");

-- CreateIndex
CREATE INDEX "stock_movement_batch_id_created_at_idx" ON "stock_movement"("batch_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_created_at_idx" ON "stock_movement"("created_at");

-- CreateIndex
CREATE INDEX "stock_movement_invoice_item_id_idx" ON "stock_movement"("invoice_item_id");

-- CreateIndex
CREATE INDEX "surgery_patient_id_idx" ON "surgery"("patient_id");

-- CreateIndex
CREATE INDEX "surgery_addendum_surgery_id_idx" ON "surgery_addendum"("surgery_id");

-- CreateIndex
CREATE INDEX "vaccination_record_id_idx" ON "vaccination"("record_id");

-- CreateIndex
CREATE INDEX "vaccination_item_id_idx" ON "vaccination"("item_id");

-- CreateIndex
CREATE INDEX "vaccination_given_at_idx" ON "vaccination"("given_at");

-- CreateIndex
CREATE INDEX "visit_patient_id_visit_date_idx" ON "visit"("patient_id", "visit_date");

-- CreateIndex
CREATE INDEX "visit_status_idx" ON "visit"("status");
