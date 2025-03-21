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
import LogoImage from "../../../public/logo-oticas-queiroz.png";
import type { Customer } from "../../../app/types/customer";
import type { OrderFormValues } from "@/app/types/form-types";

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
  tableCellRight: {
    flex: 1,
    padding: 3,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    padding: 5,
    fontWeight: "bold",
  },
  discountRow: {
    flexDirection: "row",
    padding: 5,
  },
  finalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    padding: 5,
    fontWeight: "bold",
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

// Função para obter o rótulo do tipo de produto
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
    const totalPrice = data.finalPrice || 0;
    const installments = data.installments || 1;
    const paymentEntry = data.paymentEntry || 0;

    const remainingAmount = totalPrice - paymentEntry;
    return remainingAmount <= 0 ? 0 : remainingAmount / installments;
  };

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  // Formatar números dos graus
  const formatRefractionValue = (value: number) => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}`;
  };

  // Verificar se há produtos selecionados
  const hasProducts = Array.isArray(data.products) && data.products.length > 0;

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

        <Text style={styles.title}>PEDIDO</Text>

        {/* Dados do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>
              {customer?.name || "N/A"}
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

        {/* Dados do Pedido e Produtos */}
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
              <Text style={styles.label}>Data de Entrega Prevista:</Text>
              <Text style={styles.value}>
                {formatDate(data.deliveryDate)}
              </Text>
            </View>
          )}

          {/* Tabela de Produtos */}
          {hasProducts && (
            <View style={styles.table}>
              <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                PRODUTOS
              </Text>
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

          {/* Informações de Pagamento */}
          <Text style={{ fontWeight: "bold", marginTop: 10, marginBottom: 5 }}>
            FORMA DE PAGAMENTO
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Método:</Text>
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

        {/* Receita Médica */}
        {data.prescriptionData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECEITA MÉDICA</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Médico:</Text>
              <Text style={styles.value}>
                {data.prescriptionData.doctorName || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Clínica:</Text>
              <Text style={styles.value}>
                {data.prescriptionData.clinicName || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data da Consulta:</Text>
              <Text style={styles.value}>
                {formatDate(data.prescriptionData.appointmentDate)}
              </Text>
            </View>

            {/* Tabela de dados da prescrição */}
            <View style={styles.prescriptionTable}>
              <View style={styles.prescriptionTableHeader}>
                <Text style={[styles.prescriptionTableCell, { width: 70 }]}>
                  Olho
                </Text>
                <Text style={styles.prescriptionTableCell}>SPH</Text>
                <Text style={styles.prescriptionTableCell}>CYL</Text>
                <Text style={styles.prescriptionTableCell}>AXIS</Text>
                <Text style={styles.prescriptionTableCell}>PD</Text>
              </View>

              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 70, fontWeight: "bold" },
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
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.leftEye.pd}
                </Text>
              </View>

              <View style={styles.prescriptionTableRow}>
                <Text
                  style={[
                    styles.prescriptionTableCell,
                    { width: 70, fontWeight: "bold" },
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
                <Text style={styles.prescriptionTableCell}>
                  {data.prescriptionData.rightEye.pd}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <View style={styles.row}>
                <Text style={styles.label}>D.N.P.:</Text>
                <Text style={styles.value}>{data.prescriptionData.nd} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>C.O.:</Text>
                <Text style={styles.value}>{data.prescriptionData.oc}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Adição:</Text>
                <Text style={styles.value}>{data.prescriptionData.addition}</Text>
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
  formData: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

export default function OrderPdfGenerator({
  formData,
  customer,
}: OrderPdfGeneratorProps) {
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
          {loading ? "Gerando PDF..." : "Baixar Pedido em PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}