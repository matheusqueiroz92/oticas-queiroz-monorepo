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
import type { Order } from "@/app/_types/order";
import type { Product } from "@/app/_types/product";

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
  tableCellSmall: {
    flex: 1,
    padding: 2,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    padding: 2,
    textAlign: "right",
  },
  additionalInfoSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderTopStyle: "solid",
  },
  additionalInfoTitle: {
    fontWeight: "bold",
    padding: 4,
    backgroundColor: "#f8f8f8",
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
});

interface OrderPDFDocumentProps {
  order: Order;
  clientName: string;
  employeeName: string;
}

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

const OrderPDFDocument = ({
  order,
  clientName,
  employeeName,
}: OrderPDFDocumentProps) => {
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
      cancelled: "Cancelado",
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
  // const formatRefractionValue = (value?: number) => {
  //   if (value === undefined || value === null) return "N/A";
  //   const prefix = value > 0 ? "+" : "";
  //   return `${prefix}${value.toFixed(2)}`.replace(".", ",");
  // };

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  // Verificar se o pedido tem produtos múltiplos
  const hasMultipleProducts = Array.isArray(order.products) && order.products.length > 0;

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
          {order.deliveryDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Data de Entrega:</Text>
              <Text style={styles.value}>{formatDate(order.deliveryDate)}</Text>
            </View>
          )}
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

        {/* Detalhes dos Produtos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes dos Produtos</Text>
          
          {hasMultipleProducts ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Produto</Text>
                <Text style={styles.tableCell}>Tipo</Text>
                <Text style={styles.tableCellRight}>Preço</Text>
              </View>
              
              {(order.products as Product[]).map((product, index) => (
                <View style={styles.tableRow} key={`product-${index}`}>
                  <Text style={styles.tableCellSmall}>{product.name}</Text>
                  <Text style={styles.tableCellSmall}>
                    {getProductTypeLabel(product.productType)}
                  </Text>
                  <Text style={styles.tableCellRight}>
                    {formatCurrency(product.sellPrice || 0)}
                  </Text>
                </View>
              ))}
              
              {/* Totais */}
              <View style={styles.totalRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Total:</Text>
                <Text style={styles.tableCellRight}>
                  {formatCurrency(order.totalPrice || 0)}
                </Text>
              </View>
              
              {(order.discount || 0) > 0 && (
                <View style={styles.discountRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Desconto:</Text>
                  <Text style={styles.tableCellRight}>
                    -{formatCurrency(order.discount || 0)}
                  </Text>
                </View>
              )}
              
              <View style={styles.finalRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Preço Final:</Text>
                <Text style={styles.tableCellRight}>
                  {formatCurrency(order.finalPrice || order.totalPrice || 0)}
                </Text>
              </View>
            </View>
          ) : (
            // Fallback para um único produto (compatibilidade com versões antigas)
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Produto:</Text>
                <Text style={styles.value}>
                  {typeof order.products === 'string'
                    ? order.products
                    : (order.products as any)?.name || 'N/A'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Preço:</Text>
                <Text style={styles.value}>
                  {formatCurrency(order.totalPrice || 0)}
                </Text>
              </View>
            </>
          )}
          
          {/* Observações */}
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
                {formatCurrency(order.paymentEntry)}
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
              {formatCurrency(order.totalPrice)}
            </Text>
          </View>
          {(order.discount || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Desconto:</Text>
              <Text style={styles.value}>
                -{formatCurrency(order.discount || 0)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Valor Final:</Text>
            <Text style={styles.value}>
              {formatCurrency(order.finalPrice || order.totalPrice)}
            </Text>
          </View>
        </View>

        {/* Receita Médica */}
        {order.prescriptionData && (
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
                    <Text style={styles.tableCell}>Esf.</Text>
                    <Text style={styles.tableCell}>Cil.</Text>
                    <Text style={styles.tableCell}>Eixo</Text>
                    <Text style={styles.tableCell}>PD</Text>
                  </View>
                  {order.prescriptionData.leftEye && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Esquerdo</Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.sph}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.cyl}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.leftEye.pd || "N/A"}
                      </Text>
                    </View>
                  )}
                  {order.prescriptionData.rightEye && (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>Direito</Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.sph}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.cyl}
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.axis || "N/A"}°
                      </Text>
                      <Text style={styles.tableCell}>
                        {order.prescriptionData.rightEye.pd || "N/A"}
                      </Text>
                    </View>
                  )}

                  {/* Informações adicionais */}
                  <View style={styles.additionalInfoSection}>
                    <Text style={styles.additionalInfoTitle}>
                      Informações adicionais
                    </Text>

                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                        D.N.P.
                      </Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>
                        {order.prescriptionData.nd || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                        C.O.
                      </Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>
                        {order.prescriptionData.oc || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                        Adição
                      </Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>
                        {order.prescriptionData.addition || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>
            Este documento é uma cópia dos dados registrados no sistema das
            Óticas Queiroz.
          </Text>
          <Text>Documento gerado em {new Date().toLocaleString("pt-BR")}</Text>
        </View>
      </Page>
    </Document>
  );
};

interface OrderDetailsPDFProps {
  order: Order;
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
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loading}
        >
          <FileDown/>
          {loading ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default OrderDetailsPDF;