import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDate, formatRupiah } from "@/lib/format";

export type InvoicePdfData = {
  clinic: { name: string; address: string; phone: string; npwp: string; footer: string; logo: string | null };
  invoiceNo: string;
  date: Date;
  statusLabel: string;
  billedTo: { name: string; whatsapp: string | null };
  patient: { name: string; species: string; rmNo: string } | null;
  lines: { name: string; qty: number; unitPrice: number; discountLabel: string; total: number }[];
  subtotal: number;
  discountTotal: number;
  taxLabel: string | null;
  taxTotal: number;
  grandTotal: number;
  payments: { label: string; date: Date; amount: number }[];
  remaining: number;
};

const ink = "#1F2328";
const muted = "#59636E";
const line = "#E3E6EA";
const primary = "#533872";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  clinic: { maxWidth: 300 },
  clinicName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: primary, marginBottom: 3 },
  muted: { color: muted },
  logo: { height: 44, objectFit: "contain" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  status: { fontFamily: "Helvetica-Bold", color: primary },
  twoCols: { flexDirection: "row", gap: 24, marginBottom: 18 },
  col: { flex: 1 },
  label: { fontSize: 8, color: muted, textTransform: "uppercase", marginBottom: 2 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: line, paddingBottom: 4, color: muted, fontSize: 9 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 6 },
  cName: { flex: 4 },
  cQty: { flex: 1, textAlign: "right" },
  cPrice: { flex: 2, textAlign: "right" },
  cDisc: { flex: 1.5, textAlign: "right" },
  cTotal: { flex: 2, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: line, marginTop: 4, paddingTop: 6, fontSize: 13, fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 28, borderTopWidth: 1, borderTopColor: line, paddingTop: 8, color: muted, fontSize: 8.5 },
});

const rupiah = (n: number) => n.toLocaleString("id-ID");

function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const { clinic } = data;
  return (
    <Document title={data.invoiceNo} author={clinic.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.clinic}>
            <Text style={s.clinicName}>{clinic.name}</Text>
            {clinic.address ? <Text style={s.muted}>{clinic.address}</Text> : null}
            {clinic.phone ? <Text style={s.muted}>Telp {clinic.phone}</Text> : null}
            {clinic.npwp ? <Text style={s.muted}>NPWP {clinic.npwp}</Text> : null}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {clinic.logo ? <Image src={clinic.logo} style={s.logo} /> : null}
        </View>

        <View style={s.titleRow}>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.muted}>{data.invoiceNo} · {formatDate(data.date)}</Text>
          </View>
          <Text style={s.status}>{data.statusLabel}</Text>
        </View>

        <View style={s.twoCols}>
          <View style={s.col}>
            <Text style={s.label}>Ditagihkan kepada</Text>
            <Text>{data.billedTo.name}</Text>
            {data.billedTo.whatsapp ? <Text style={s.muted}>WA {data.billedTo.whatsapp}</Text> : null}
          </View>
          {data.patient ? (
            <View style={s.col}>
              <Text style={s.label}>Pasien</Text>
              <Text>{data.patient.name}</Text>
              <Text style={s.muted}>{data.patient.species} · {data.patient.rmNo}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.th}>
          <Text style={s.cName}>Item</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cPrice}>Harga</Text>
          <Text style={s.cDisc}>Diskon</Text>
          <Text style={s.cTotal}>Jumlah</Text>
        </View>
        {data.lines.map((item, i) => (
          <View key={i} style={s.tr} wrap={false}>
            <Text style={s.cName}>{item.name}</Text>
            <Text style={s.cQty}>{item.qty}</Text>
            <Text style={s.cPrice}>{rupiah(item.unitPrice)}</Text>
            <Text style={s.cDisc}>{item.discountLabel}</Text>
            <Text style={s.cTotal}>{rupiah(item.total)}</Text>
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}><Text style={s.muted}>Subtotal</Text><Text>{formatRupiah(data.subtotal)}</Text></View>
          {data.discountTotal > 0 ? <View style={s.totalRow}><Text style={s.muted}>Diskon</Text><Text>-{formatRupiah(data.discountTotal)}</Text></View> : null}
          {data.taxLabel ? <View style={s.totalRow}><Text style={s.muted}>{data.taxLabel}</Text><Text>{formatRupiah(data.taxTotal)}</Text></View> : null}
          <View style={s.grand}><Text>Total</Text><Text>{formatRupiah(data.grandTotal)}</Text></View>
          {data.payments.map((p, i) => (
            <View key={i} style={s.totalRow}><Text style={s.muted}>{p.label} ({formatDate(p.date)})</Text><Text>{formatRupiah(p.amount)}</Text></View>
          ))}
          {data.remaining > 0 ? <View style={[s.totalRow, { fontFamily: "Helvetica-Bold" }]}><Text>Sisa tagihan</Text><Text>{formatRupiah(data.remaining)}</Text></View> : null}
        </View>

        <View style={s.footer}>
          {clinic.footer ? <Text>{clinic.footer}</Text> : null}
          <Text>Dokumen ini adalah invoice digital, bukan faktur pajak.</Text>
        </View>
      </Page>
    </Document>
  );
}

export const renderInvoicePdf = (data: InvoicePdfData) => renderToBuffer(<InvoicePdf data={data} />);
