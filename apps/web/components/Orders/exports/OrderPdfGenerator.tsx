import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import LogoImage from "../../../public/logo-oticas-queiroz.png";
import type { Customer } from "../../../app/_types/customer";
import type { OrderFormValues } from "@/app/_types/order";

const companyInfo = {
  name: "Óticas Queiroz",
  logo: LogoImage.src,
  address: "Rua J. J. Seabra, 116 - Centro. Itapetinga-Bahia. CEP: 45700-000",
  phone: "(77) 3262-1344",
  whatsapp: "(77) 98801-8192",
  email: "contato@oticasqueiroz.com.br",
  website: "www.oticasqueiroz.com.br",
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  section: {
    marginBottom: 10,
    borderBottom: "1pt solid #ccc",
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
    paddingBottom: 5,
  },
  logoContainer: {
    width: 50,
    marginRight: 10,
  },
  logo: {
    maxWidth: 50,
    maxHeight: 40,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 7,
    marginBottom: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    marginTop: 4,
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    backgroundColor: "#f8f8f8",
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    width: 80,
    fontWeight: "bold",
    fontSize: 7,
  },
  value: {
    flex: 1,
    fontSize: 7,
  },
  table: {
    marginTop: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 2,
    paddingTop: 2,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 2,
    fontSize: 7,
  },
  tableCellRight: {
    flex: 1,
    padding: 2,
    textAlign: "right",
    fontSize: 7,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    padding: 2,
    fontWeight: "bold",
  },
  discountRow: {
    flexDirection: "row",
    padding: 2,
  },
  finalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    padding: 2,
    fontWeight: "bold",
  },
  signatureSection: {
    marginTop: 15,
    paddingTop: 10,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    marginTop: 20,
    marginBottom: 2,
    width: 150,
    alignSelf: "center",
  },
  signatureLabel: {
    textAlign: "center",
    fontSize: 7,
  },
  footer: {
    textAlign: "center",
    fontSize: 6,
    color: "#666",
    marginTop: 5,
  },
  orderNumber: {
    position: "absolute",
    top: 20,
    right: 20,
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomStyle: "dashed",
    borderBottomColor: "#000",
    marginVertical: 10,
  },
  prescriptionTable: {
    marginTop: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "solid",
    fontSize: 7,
  },
  prescriptionTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
  },
  prescriptionTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingVertical: 2,
  },
  prescriptionTableCell: {
    flex: 1,
    paddingHorizontal: 2,
    textAlign: "center",
    fontSize: 7,
  },
  prescriptionTableLabel: {
    width: 60,
    paddingLeft: 2,
    fontWeight: "bold",
    fontSize: 7,
  },
  copyLabel: {
    textAlign: "center",
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
    backgroundColor: "#eee",
    padding: 3,
  },
  via: {
    textAlign: "right",
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 2,
    fontStyle: "italic",
  },
});

const getProductTypeLabel = (type?: string): string => {
  const types: Record<string, string> = {
    lenses: "Lentes",
    clean_lenses: "Limpa-lentes",
    prescription_frame: "Armação de grau",
    sunglasses_frame: "Armação solar"
  };
  
  if (!type) return "Não especificado";
  return types[type] || type;
};

interface OrderPDFProps {
  data: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

// Componente para renderizar uma via do pedido
const OrderSection = ({ data, customer, isFirstVia = true }: OrderPDFProps & { isFirstVia?: boolean }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Data inválida";
    }
  };

  const calculateInstallmentValue = () => {
    const totalPrice = data.finalPrice || 0;
    const installments = data.installments || 1;
    const paymentEntry = data.paymentEntry || 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const formatRefractionValue = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}`;
  };

  const hasProducts = Array.isArray(data.products) && data.products.length > 0;

  return (
    <View>
      <Text style={styles.via}>{isFirstVia ? "1ª VIA - CLIENTE" : "2ª VIA - LOJA"}</Text>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} src={companyInfo.logo} />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{companyInfo.name}</Text>
          <Text style={styles.companyDetail}>{companyInfo.address}</Text>
          <Text style={styles.companyDetail}>
            Tel: {companyInfo.phone} | WhatsApp: {companyInfo.whatsapp}
          </Text>
        </View>
      </View>

      {data._id && (
        <Text style={styles.orderNumber}>Pedido #: {data._id.substring(0, 8)}</Text>
      )}

      <Text style={styles.title}>PEDIDO</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.value}>
            {customer?.name || "N/A"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Telefone:</Text>
          <Text style={styles.value}>{customer?.phone || "N/A"}</Text>
        </View>
        {customer?.cpf && (
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{customer?.cpf || "N/A"}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DETALHES DO PEDIDO</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Data do Pedido:</Text>
          <Text style={styles.value}>
            {formatDate(data.orderDate)}
          </Text>
        </View>
        {data.deliveryDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Data de Entrega:</Text>
            <Text style={styles.value}>
              {formatDate(data.deliveryDate)}
            </Text>
          </View>
        )}
        {data.serviceOrder && (
          <View style={styles.row}>
            <Text style={styles.label}>Nº O.S.:</Text>
            <Text style={styles.value}>
              {data.serviceOrder}
            </Text>
          </View>
        )}

        {hasProducts && (
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableHeader]}>Produto</Text>
              <Text style={[styles.tableCell, styles.tableHeader]}>Tipo</Text>
              <Text style={[styles.tableCellRight, styles.tableHeader]}>Preço</Text>
            </View>
            
            {data.products.map((product, index) => (
              <View style={styles.tableRow} key={`${index}-${product._id || 'unknown'}`}>
                <Text style={styles.tableCell}>{product.name}</Text>
                <Text style={styles.tableCell}>{getProductTypeLabel(product.productType)}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(product.sellPrice || 0)}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total:</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(data.totalPrice || 0)}</Text>
            </View>
            
            {(data.discount > 0) && (
              <View style={styles.discountRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Desconto:</Text>
                <Text style={styles.tableCellRight}>-{formatCurrency(data.discount)}</Text>
              </View>
            )}
            
            <View style={styles.finalRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Preço Final:</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(data.finalPrice)}</Text>
            </View>
          </View>
        )}

        <Text style={{ fontWeight: "bold", marginTop: 5, marginBottom: 2, fontSize: 8 }}>
          FORMA DE PAGAMENTO
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Método:</Text>
          <Text style={styles.value}>
            {data.paymentMethod === "credit" && "Cartão de Crédito"}
            {data.paymentMethod === "debit" && "Cartão de Débito"}
            {data.paymentMethod === "cash" && "Dinheiro"}
            {data.paymentMethod === "pix" && "PIX"}
            {data.paymentMethod === "bank_slip" && "Boleto"}
            {data.paymentMethod === "promissory_note" && "Promissória"}
            {data.paymentMethod === "check" && "Cheque"}
            {data.paymentMethod === "installment" && "Parcelado"}
          </Text>
        </View>

        {(data.paymentEntry ?? 0) > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Valor de Entrada:</Text>
            <Text style={styles.value}>
              {formatCurrency(data.paymentEntry || 0)}
            </Text>
          </View>
        )}

        {data.installments && data.installments > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Parcelas:</Text>
            <Text style={styles.value}>
              {data.installments}x de {formatCurrency(calculateInstallmentValue())}
            </Text>
          </View>
        )}
      </View>

      {data.prescriptionData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECEITA MÉDICA</Text>

          {data.prescriptionData.doctorName && (
            <View style={styles.row}>
              <Text style={styles.label}>Médico:</Text>
              <Text style={styles.value}>{data.prescriptionData.doctorName}</Text>
            </View>
          )}

          {data.prescriptionData.appointmentDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Data Consulta:</Text>
              <Text style={styles.value}>{formatDate(data.prescriptionData.appointmentDate)}</Text>
            </View>
          )}

          <View style={styles.prescriptionTable}>
            <View style={styles.prescriptionTableHeader}>
              <Text style={[styles.prescriptionTableCell, { width: 40 }]}>Olho</Text>
              <Text style={styles.prescriptionTableCell}>ESF</Text>
              <Text style={styles.prescriptionTableCell}>CIL</Text>
              <Text style={styles.prescriptionTableCell}>EIXO</Text>
              <Text style={styles.prescriptionTableCell}>DP</Text>
            </View>

            <View style={styles.prescriptionTableRow}>
              <Text style={[styles.prescriptionTableCell, { width: 40, fontWeight: "bold" }]}>ESQ</Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.leftEye.sph}
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.leftEye.cyl}
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.leftEye.axis}°
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.leftEye.pd}
              </Text>
            </View>

            <View style={styles.prescriptionTableRow}>
              <Text style={[styles.prescriptionTableCell, { width: 40, fontWeight: "bold" }]}>DIR</Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.rightEye.sph}
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.rightEye.cyl}
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.rightEye.axis}°
              </Text>
              <Text style={styles.prescriptionTableCell}>
                {data.prescriptionData.rightEye.pd}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 4 }}>
            <View style={styles.row}>
              <Text style={styles.label}>D.N.P.:</Text>
              <Text style={styles.value}>{data.prescriptionData.nd} mm</Text>
            </View>
            {data.prescriptionData.addition && (
              <View style={styles.row}>
                <Text style={styles.label}>Adição:</Text>
                <Text style={styles.value}>{data.prescriptionData.addition}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {data.observations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
          <Text style={styles.value}>{data.observations}</Text>
        </View>
      )}

      <View style={styles.signatureSection}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Assinatura do Cliente</Text>
      </View>

      <Text style={styles.footer}>
        Este documento é um comprovante de pedido. Para mais informações entre
        em contato com {companyInfo.name} pelo telefone {companyInfo.phone}.
      </Text>
    </View>
  );
};

// Componente principal do PDF com duas vias
const OrderPDF = ({ data, customer }: OrderPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1ª Via - Cliente */}
        <OrderSection data={data} customer={customer} isFirstVia={true} />
        
        {/* Linha divisória entre as vias */}
        <View style={styles.divider} />
        
        {/* 2ª Via - Loja */}
        <OrderSection data={data} customer={customer} isFirstVia={false} />
      </Page>
    </Document>
  );
};

interface OrderCompactPdfGeneratorProps {
  formData: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

export default function OrderCompactPdfGenerator({
  formData,
  customer,
}: OrderCompactPdfGeneratorProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDF data={formData} customer={customer} />}
      fileName={`pedido-${formData._id || new Date().toISOString().split("T")[0]}.pdf`}
      className="block w-full"
    >
      {({ loading, error }) => (
        <Button
          type="button"
          className="w-full"
          disabled={loading || !!error}
          variant="outline"
        >
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? "Gerando PDF..." : "Baixar Pedido em PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}