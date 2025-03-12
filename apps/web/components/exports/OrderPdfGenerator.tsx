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
import LogoImage from "../../public/logo-oticas-queiroz.png";
import type { Customer } from "../../app/types/customer";

// Interface para os dados do formulário
interface OrderFormData {
  _id?: string;
  clientId: string;
  customClientName?: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate?: string;
  status: string;
  lensType?: string;
  observations?: string;
  totalPrice: number;
  prescriptionData?: {
    doctorName?: string; // Mudado para opcional
    clinicName?: string; // Mudado para opcional
    appointmentDate?: string; // Mudado para opcional
    leftEye: { sph: number; cyl: number; axis: number };
    rightEye: { sph: number; cyl: number; axis: number };
    nd: number;
    oc: number;
    addition: number;
  };
}

// Dados da empresa
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
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
    paddingBottom: 5,
  },
  logoContainer: {
    width: 80,
    marginRight: 10,
  },
  logo: {
    maxWidth: 80,
    maxHeight: 70,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  companyDetail: {
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "solid",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f8f8f8",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 3,
    paddingTop: 3,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 3,
  },
  prescriptionTable: {
    marginTop: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "solid",
  },
  prescriptionTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
  },
  prescriptionTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingVertical: 5,
  },
  prescriptionTableCell: {
    flex: 1,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  prescriptionTableLabel: {
    width: 80,
    paddingLeft: 5,
    fontWeight: "bold",
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    borderTopStyle: "solid",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    marginTop: 50,
    marginBottom: 5,
    width: 250,
    alignSelf: "center",
  },
  signatureLabel: {
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    borderTopStyle: "solid",
    paddingTop: 10,
  },
  orderNumber: {
    position: "absolute",
    top: 30,
    right: 30,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
});

interface OrderPDFProps {
  data: OrderFormData;
  customer: Customer | null;
}

const OrderPDF = ({ data, customer }: OrderPDFProps) => {
  // Função para formatar datas com verificação de undefined
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Data inválida";
    }
  };

  // Calcular valor da parcela com verificação para valores undefined
  const calculateInstallmentValue = () => {
    const totalPrice = data.totalPrice || 0;
    const installments = data.installments || 1;
    const paymentEntry = data.paymentEntry || 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  // Formatar números dos graus
  const formatRefractionValue = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}`;
  };

  return (
    <Document>
      <Page style={styles.page}>
        {/* Cabeçalho com logo e dados da empresa */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo} src={companyInfo.logo} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text style={styles.companyDetail}>{companyInfo.address}</Text>
            <Text style={styles.companyDetail}>
              Telefone: {companyInfo.phone}/ WhatsApp: {companyInfo.whatsapp}
            </Text>
            <Text style={styles.companyDetail}>Email: {companyInfo.email}</Text>
            <Text style={styles.companyDetail}>
              Site: {companyInfo.website}
            </Text>
          </View>
        </View>

        {/* Número do pedido */}
        {data._id && (
          <Text style={styles.orderNumber}>Pedido #: {data._id}</Text>
        )}

        <Text style={styles.title}>PEDIDO DE ÓCULOS</Text>

        {/* Dados do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>
              {customer?.name || data.customClientName || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{customer?.address || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefone:</Text>
            <Text style={styles.value}>{customer?.phone || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{customer?.email || "N/A"}</Text>
          </View>
        </View>

        {/* Dados do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALHES DO PEDIDO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Data do Pedido:</Text>
            <Text style={styles.value}>
              {formatDate(new Date().toISOString())}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Produto:</Text>
            <Text style={styles.value}>{data.product}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo de Óculos:</Text>
            <Text style={styles.value}>
              {data.glassesType === "prescription"
                ? "Óculos de Grau"
                : "Óculos Solar"}
            </Text>
          </View>

          {data.glassesType === "prescription" && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Data de Entrega:</Text>
                <Text style={styles.value}>
                  {formatDate(data.deliveryDate)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de Lente:</Text>
                <Text style={styles.value}>{data.lensType || "N/A"}</Text>
              </View>
            </>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Forma de Pagamento:</Text>
            <Text style={styles.value}>
              {data.paymentMethod === "credit" && "Cartão de Crédito"}
              {data.paymentMethod === "debit" && "Cartão de Débito"}
              {data.paymentMethod === "cash" && "Dinheiro"}
              {data.paymentMethod === "pix" && "PIX"}
              {data.paymentMethod === "installment" && "Parcelado"}
            </Text>
          </View>

          {(data.paymentEntry ?? 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Valor de Entrada:</Text>
              <Text style={styles.value}>
                R$ {(data.paymentEntry ?? 0).toFixed(2)}
              </Text>
            </View>
          )}

          {(data.installments ?? 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Parcelas:</Text>
              <Text style={styles.value}>
                {data.installments}x de R${" "}
                {calculateInstallmentValue().toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Preço Total:</Text>
            <Text style={styles.value}>R$ {data.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Receita (apenas para óculos de grau) - Formato de tabela para laboratório */}
        {data.glassesType === "prescription" && data.prescriptionData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMAÇÕES DA RECEITA</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Médico:</Text>
              <Text style={styles.value}>
                {data.prescriptionData.doctorName}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Clínica:</Text>
              <Text style={styles.value}>
                {data.prescriptionData.clinicName}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data da Consulta:</Text>
              <Text style={styles.value}>
                {formatDate(data.prescriptionData.appointmentDate)}
              </Text>
            </View>

            {/* Tabela da receita para o laboratório */}
            <View style={[styles.table, { marginTop: 15 }]}>
              <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                MEDIDAS PARA USO DO LABORATÓRIO
              </Text>

              {/* Cabeçalho da tabela de receita */}
              <View style={styles.prescriptionTableHeader}>
                <Text style={[styles.prescriptionTableCell, { width: 80 }]}>
                  Olho
                </Text>
                <Text style={styles.prescriptionTableCell}>SPH</Text>
                <Text style={styles.prescriptionTableCell}>CYL</Text>
                <Text style={styles.prescriptionTableCell}>AXIS</Text>
              </View>

              {/* Olho Esquerdo */}
              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 80, fontWeight: "bold" },
                  ]}
                >
                  Esquerdo
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {formatRefractionValue(data.prescriptionData.leftEye.sph)}
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {formatRefractionValue(data.prescriptionData.leftEye.cyl)}
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.leftEye.axis}°
                </Text>
              </View>

              {/* Olho Direito */}
              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 80, fontWeight: "bold" },
                  ]}
                >
                  Direito
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {formatRefractionValue(data.prescriptionData.rightEye.sph)}
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {formatRefractionValue(data.prescriptionData.rightEye.cyl)}
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.rightEye.axis}°
                </Text>
              </View>

              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 80, fontWeight: "bold" },
                  ]}
                >
                  D.N.P.
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.nd}mm
                </Text>
              </View>

              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 80, fontWeight: "bold" },
                  ]}
                >
                  C.O.
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.oc}
                </Text>
              </View>

              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 80, fontWeight: "bold" },
                  ]}
                >
                  Adição
                </Text>
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.addition}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Observações */}
        {data.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text>{data.observations}</Text>
          </View>
        )}

        {/* Assinatura */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Assinatura do Cliente</Text>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          Este documento é um comprovante de pedido. Para mais informações entre
          em contato com {companyInfo.name} pelo telefone {companyInfo.phone}.
          Pedido gerado em {new Date().toLocaleString()}.
        </Text>
      </Page>
    </Document>
  );
};

interface OrderPdfGeneratorProps {
  formData: OrderFormData;
  customer: Customer | null;
}

export default function OrderPdfGenerator({
  formData,
  customer,
}: OrderPdfGeneratorProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDF data={formData} customer={customer} />}
      fileName={`pedido-oculos-${new Date().toISOString().split("T")[0]}.pdf`}
      className="block w-full"
    >
      {({ loading, error }) => (
        <Button
          type="button"
          className="w-full"
          disabled={loading || !!error}
          variant="outline"
        >
          {loading ? "Gerando PDF..." : "Baixar Pedido em PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
