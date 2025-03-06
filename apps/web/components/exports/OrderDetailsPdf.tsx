// components/OrderDetailsPDF.tsx
import React from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { OrderDetail } from "@/app/types/order-details";

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
    paddingBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
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
    width: "100%",
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "solid",
    marginTop: 10,
  },
  tableHeader: {
    backgroundColor: "#f8f8f8",
    flexDirection: "row",
    fontWeight: "bold",
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderTopStyle: "solid",
    padding: 5,
  },
  tableCell: {
    flex: 1,
    padding: 2,
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
});

// Interface para o documento PDF
interface OrderPDFDocumentProps {
  order: OrderDetail;
  clientName: string;
  employeeName: string;
}

// Componente do documento PDF
const OrderPDFDocument = ({
  order,
  clientName,
  employeeName,
}: OrderPDFDocumentProps) => {
  // Função para formatar a data
  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "N/A";
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("pt-BR");
  };

  // Tradução de status
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };
    return statusMap[status] || status;
  };

  // Tradução do método de pagamento
  const translatePaymentMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      installment: "Parcelado",
    };
    return methodMap[method] || method;
  };

  // Formatar valores de grau
  const formatRefractionValue = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}`.replace(".", ",");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Óticas Queiroz</Text>
          <Text style={styles.subtitle}>Detalhes do Pedido #{order._id}</Text>
        </View>

        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{translateStatus(order.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Criação:</Text>
            <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Cliente e Vendedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente e Vendedor</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vendedor:</Text>
            <Text style={styles.value}>{employeeName}</Text>
          </View>
        </View>

        {/* Detalhes do Produto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Produto</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Produto:</Text>
            <Text style={styles.value}>{order.product}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>
              {order.glassesType === "prescription"
                ? "Óculos de Grau"
                : "Óculos Solar"}
            </Text>
          </View>
          {order.glassesType === "prescription" && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de Lente:</Text>
                <Text style={styles.value}>{order.lensType || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Data de Entrega:</Text>
                <Text style={styles.value}>
                  {formatDate(order.deliveryDate)}
                </Text>
              </View>
            </>
          )}
          {order.observations && (
            <View style={styles.row}>
              <Text style={styles.label}>Observações:</Text>
              <Text style={styles.value}>{order.observations}</Text>
            </View>
          )}
        </View>

        {/* Informações de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Pagamento</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Método de Pagamento:</Text>
            <Text style={styles.value}>
              {translatePaymentMethod(order.paymentMethod)}
            </Text>
          </View>
          {order.paymentEntry !== undefined && order.paymentEntry > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Entrada:</Text>
              <Text style={styles.value}>
                R$ {order.paymentEntry.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          )}
          {order.installments !== undefined && order.installments > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Parcelas:</Text>
              <Text style={styles.value}>{order.installments}x</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Valor Total:</Text>
            <Text style={styles.value}>
              R$ {order.totalPrice.toFixed(2).replace(".", ",")}
            </Text>
          </View>
        </View>

        {/* Receita Médica (se for óculos de grau) */}
        {order.prescriptionData && order.glassesType === "prescription" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receita Médica</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Médico:</Text>
              <Text style={styles.value}>
                {order.prescriptionData.doctorName || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Clínica:</Text>
              <Text style={styles.value}>
                {order.prescriptionData.clinicName || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data da Consulta:</Text>
              <Text style={styles.value}>
                {formatDate(order.prescriptionData.appointmentDate)}
              </Text>
            </View>

            {/* Tabela de receita */}
            {order.prescriptionData.leftEye &&
              order.prescriptionData.rightEye && (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableCell}>Olho</Text>
                    <Text style={styles.tableCell}>SPH</Text>
                    <Text style={styles.tableCell}>CYL</Text>
                    <Text style={styles.tableCell}>AXIS</Text>
                    <Text style={styles.tableCell}>PD</Text>
                  </View>
                  {order.prescriptionData.leftEye.near && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Esq. (Perto)</Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.leftEye.near.sph
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.leftEye.near.cyl
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.near.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.near.pd || "N/A"}mm
                      </Text>
                    </View>
                  )}
                  {order.prescriptionData.leftEye.far && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Esq. (Longe)</Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.leftEye.far.sph
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.leftEye.far.cyl
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.far.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.far.pd || "N/A"}mm
                      </Text>
                    </View>
                  )}
                  {order.prescriptionData.rightEye.near && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Dir. (Perto)</Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.rightEye.near.sph
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.rightEye.near.cyl
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.near.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.near.pd || "N/A"}mm
                      </Text>
                    </View>
                  )}
                  {order.prescriptionData.rightEye.far && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Dir. (Longe)</Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.rightEye.far.sph
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {formatRefractionValue(
                          order.prescriptionData.rightEye.far.cyl
                        )}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.far.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.far.pd || "N/A"}mm
                      </Text>
                    </View>
                  )}
                </View>
              )}
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>
            Este documento é uma cópia dos dados registrados no sistema Óticas
            Queiroz.
          </Text>
          <Text>Documento gerado em {new Date().toLocaleString("pt-BR")}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Componente principal que será exportado
interface OrderDetailsPDFProps {
  order: OrderDetail;
  clientName: string;
  employeeName: string;
}

const OrderDetailsPDF = ({
  order,
  clientName,
  employeeName,
}: OrderDetailsPDFProps) => {
  return (
    <PDFDownloadLink
      document={
        <OrderPDFDocument
          order={order}
          clientName={clientName}
          employeeName={employeeName}
        />
      }
      fileName={`pedido-${order._id}.pdf`}
      className="block w-full"
    >
      {({ loading }) => (
        <Button variant="outline" className="w-full" disabled={loading}>
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default OrderDetailsPDF;
