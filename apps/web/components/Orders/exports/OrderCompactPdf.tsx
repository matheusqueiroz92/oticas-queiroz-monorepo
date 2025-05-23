import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import LogoImage from "../../../public/logo-oticas-queiroz.png";
import type { Customer } from "../../../app/_types/customer";
import type { OrderFormValues } from "@/app/_types/order";
import type { Product } from "@/app/_types/product";
import { getProductTypeLabel } from "@/app/_utils/product-utils";

export interface OrderPDFProps {
  data: OrderFormValues & { _id?: string };
  customer: Customer | null;
}

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
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomStyle: "dashed",
    borderBottomColor: "#000",
    marginVertical: 5,
  },

  // Cabeçalho
  header: {
    flexDirection: "row",
    marginBottom: 5,
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
    fontSize: 8,
    marginBottom: 1,
  },

  // Número do Pedido e OS
  osContainer: {
    backgroundColor: "#f0f0f0", 
    padding: 5, 
    marginBottom: 5,
    borderRadius: 3,
    textAlign: "center",
  },
  osTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  orderNumber: {
    fontSize: 8,
    color: "#333",
  },

  // Seções do Pedido
  rowContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  columnHalf: {
    width: "50%",
    paddingRight: 5,
  },
  sectionBox: {
    border: "1pt solid #ddd",
    borderRadius: 3,
    marginBottom: 8,
    padding: 5,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    backgroundColor: "#f8f8f8",
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  dataRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    width: 60,
    fontWeight: "bold",
    fontSize: 7,
  },
  value: {
    flex: 1,
    fontSize: 7,
  },

  // Tabela de Produtos
  table: {
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "solid",
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 1,
    paddingTop: 1,
    fontSize: 7,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 1,
    fontSize: 7,
  },
  productCell: {
    width: "50%",
    padding: 2,
  },
  typeCell: {
    width: "25%",
    padding: 2,
  },
  priceCell: {
    width: "25%",
    padding: 2,
    textAlign: "right",
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

  // Prescrição
  prescriptionTable: {
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "solid",
    fontSize: 7,
    marginTop: 2,
    borderRadius: 3,
  },
  prescriptionTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    textAlign: "center",
    fontSize: 7,
  },
  eyeCell: {
    width: "15%",
  },
  dataCell: {
    width: "21.25%",
  },

  // Assinatura
  signatureSection: {
    marginTop: 5,
    paddingTop: 2,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    marginTop: 10,
    marginBottom: 4,
    width: 150,
    alignSelf: "center",
  },
  signatureLabel: {
    textAlign: "center",
    fontSize: 7,
  },

  // Rodapé e Via
  footer: {
    textAlign: "center",
    fontSize: 6,
    color: "#666",
    marginTop: 3,
  },
  via: {
    textAlign: "right",
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 1,
    fontStyle: "italic",
  },

  // Informativo sobre o sistema
  informative: {
    textAlign: "center",
    fontSize: 7,
    color: "#000",
    marginTop: 4,
  }
});

// Funções auxiliares compartilhadas
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return "Data inválida";
  }
};

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

const calculateInstallmentValue = (data: OrderFormValues & { _id?: string }) => {
  const totalPrice = data.finalPrice || 0;
  const installments = data.installments || 1;
  const paymentEntry = data.paymentEntry || 0;

  const remainingAmount = totalPrice - paymentEntry;
  return remainingAmount <= 0 ? 0 : remainingAmount / installments;
};

const formatRefractionValue = (value?: string | number): string => {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }
  
  // Para valor zero
  if (value === 0 || value === "0" || value === "+0" || value === "-0") {
    return "Neutro";
  }

  // Converte para número se estiver em string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verifica se a conversão foi bem-sucedida
  if (isNaN(numValue)) {
    return value.toString(); // Retorna o valor original se não puder converter
  }
  
  // Formata o número com sinal + explícito para valores positivos
  const sign = numValue > 0 ? "+" : "";
  return `${sign}${numValue.toFixed(2).replace(".", ",")}`;
};

// Componente para a seção de dados do cliente (compartilhado entre vias)
const ClientDataSection = ({ customer }: { customer: Customer | null }) => (
  <View style={styles.sectionBox}>
    <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
    <View style={styles.dataRow}>
      <Text style={styles.label}>Nome:</Text>
      <Text style={styles.value}>{customer?.name || "N/A"}</Text>
    </View>
    <View style={styles.dataRow}>
      <Text style={styles.label}>Telefone:</Text>
      <Text style={styles.value}>{customer?.phone || "N/A"}</Text>
    </View>
    {customer?.cpf && (
      <View style={styles.dataRow}>
        <Text style={styles.label}>CPF:</Text>
        <Text style={styles.value}>{customer?.cpf || "N/A"}</Text>
      </View>
    )}
    {customer?.address && (
      <View style={styles.dataRow}>
        <Text style={styles.label}>Endereço:</Text>
        <Text style={styles.value}>{customer?.address || "N/A"}</Text>
      </View>
    )}
  </View>
);

// Componente para a seção de detalhes do pedido (compartilhado entre vias)
const OrderDetailsSection = ({ data }: { data: OrderFormValues & { _id?: string } }) => (
  <View style={styles.sectionBox}>
    <Text style={styles.sectionTitle}>DETALHES DO PEDIDO</Text>
    <View style={styles.dataRow}>
      <Text style={styles.label}>Data do Pedido:</Text>
      <Text style={styles.value}>{formatDate(data.orderDate)}</Text>
    </View>
    {data.deliveryDate && (
      <View style={styles.dataRow}>
        <Text style={styles.label}>Data de Entrega:</Text>
        <Text style={styles.value}>{formatDate(data.deliveryDate)}</Text>
      </View>
    )}
    <View style={styles.dataRow}>
      <Text style={styles.label}>Método Pag.:</Text>
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
      <View style={styles.dataRow}>
        <Text style={styles.label}>Valor de Entrada:</Text>
        <Text style={styles.value}>{formatCurrency(data.paymentEntry || 0)}</Text>
      </View>
    )}
    {data.installments && data.installments > 0 && (
      <View style={styles.dataRow}>
        <Text style={styles.label}>Parcelas:</Text>
        <Text style={styles.value}>
          {data.installments}x de {formatCurrency(calculateInstallmentValue(data))}
        </Text>
      </View>
    )}
  </View>
);

// Componente para a seção de produtos (compartilhado entre vias)
const ProductsSection = ({ data, isClientVersion = true }: { data: OrderFormValues & { _id?: string }; isClientVersion?: boolean }) => {
  const hasProducts = Array.isArray(data.products) && data.products.length > 0;

  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>PRODUTOS</Text>
      {hasProducts && (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.productCell]}>Produto</Text>
            {isClientVersion && <Text style={[styles.tableCell, styles.typeCell]}>Tipo</Text>}
            <Text style={[
              styles.tableCell, 
              isClientVersion ? styles.priceCell : { width: "50%", textAlign: "right" }
            ]}>Preço</Text>
          </View>
          
          {data.products.map((product: Product, index: number) => (
            <View style={styles.tableRow} key={`${index}-${product._id || 'unknown'}`}>
              <Text style={[styles.tableCell, styles.productCell]}>{product.name}</Text>
              {isClientVersion && <Text style={[styles.tableCell, styles.typeCell]}>
                {getProductTypeLabel(product.productType)}
              </Text>}
              <Text style={[
                styles.tableCell, 
                isClientVersion ? styles.priceCell : { width: "50%", textAlign: "right" }
              ]}>{formatCurrency(product.sellPrice || 0)}</Text>
            </View>
          ))}
          
          <View style={styles.tableRow}>
            <Text style={[
              styles.tableCell, 
              isClientVersion ? styles.productCell : { width: "50%" },
              { fontWeight: 'bold' }
            ]}>Total:</Text>
            {isClientVersion && <Text style={[styles.tableCell, styles.typeCell]}></Text>}
            <Text style={[
              styles.tableCell, 
              isClientVersion ? styles.priceCell : { width: "50%", textAlign: "right" },
              { fontWeight: 'bold' }
            ]}>{formatCurrency(data.totalPrice || 0)}</Text>
          </View>
          
          {(data.discount > 0) && (
            <View style={styles.tableRow}>
              <Text style={[
                styles.tableCell, 
                isClientVersion ? styles.productCell : { width: "50%" }
              ]}>Desconto:</Text>
              {isClientVersion && <Text style={[styles.tableCell, styles.typeCell]}></Text>}
              <Text style={[
                styles.tableCell, 
                isClientVersion ? styles.priceCell : { width: "50%", textAlign: "right" }
              ]}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}
          
          <View style={[styles.tableRow, {borderBottomWidth: 0}]}>
            <Text style={[
              styles.tableCell, 
              isClientVersion ? styles.productCell : { width: "50%" },
              { fontWeight: 'bold' }
            ]}>Preço Final:</Text>
            {isClientVersion && <Text style={[styles.tableCell, styles.typeCell]}></Text>}
            <Text style={[
              styles.tableCell, 
              isClientVersion ? styles.priceCell : { width: "50%", textAlign: "right" },
              { fontWeight: 'bold' }
            ]}>{formatCurrency(data.finalPrice)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Componente para a seção de prescrição (compartilhado entre vias)
const PrescriptionSection = ({ data }: { data: OrderFormValues & { _id?: string } }) => {
  if (!data.prescriptionData || !data.prescriptionData.leftEye || !data.prescriptionData.rightEye) {
    return null;
  }

  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>RECEITA MÉDICA</Text>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Médico:</Text>
        <Text style={styles.value}>{data.prescriptionData.doctorName || "N/A"}</Text>
      </View>
      
      {data.prescriptionData.appointmentDate && (
        <View style={styles.dataRow}>
          <Text style={styles.label}>Data Consulta:</Text>
          <Text style={styles.value}>{formatDate(data.prescriptionData.appointmentDate)}</Text>
        </View>
      )}
      
      <View style={styles.prescriptionTable}>
        <View style={styles.prescriptionTableHeader}>
          <Text style={[styles.prescriptionTableCell, styles.eyeCell]}>Olho</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>ESF</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>CIL</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>EIXO</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>DP</Text>
        </View>

        <View style={styles.prescriptionTableRow}>
          <Text style={[styles.prescriptionTableCell, styles.eyeCell, {fontWeight: "bold"}]}>ESQ</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {formatRefractionValue(data.prescriptionData.leftEye.sph)}
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {formatRefractionValue(data.prescriptionData.leftEye.cyl)}
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {data.prescriptionData.leftEye.axis || 0}°
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {data.prescriptionData.leftEye.pd || 0}
          </Text>
        </View>

        <View style={[styles.prescriptionTableRow, {borderBottomWidth: 0}]}>
          <Text style={[styles.prescriptionTableCell, styles.eyeCell, {fontWeight: "bold"}]}>DIR</Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {formatRefractionValue(data.prescriptionData.rightEye.sph)}
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {formatRefractionValue(data.prescriptionData.rightEye.cyl)}
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {data.prescriptionData.rightEye.axis || 0}°
          </Text>
          <Text style={[styles.prescriptionTableCell, styles.dataCell]}>
            {data.prescriptionData.rightEye.pd || 0}
          </Text>
        </View>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>D.N.P.:</Text>
        <Text style={styles.value}>{data.prescriptionData.nd || 0} mm</Text>
      </View>
      
      {data.prescriptionData.addition > 0 && (
        <View style={styles.dataRow}>
          <Text style={styles.label}>Adição:</Text>
          <Text style={styles.value}>{data.prescriptionData.addition}</Text>
        </View>
      )}
    </View>
  );
};

// Componente para a 1ª Via - Cliente
const ClientOrderSection = ({ data, customer }: OrderPDFProps) => {
  const hasObservations = !!data.observations && data.observations.trim() !== '';
  
  return (
    <View>
      <Text style={styles.via}>1ª VIA - CLIENTE</Text>
      
      {/* Cabeçalho com Logo */}
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
          <Text style={styles.companyDetail}>
            E-mail: {companyInfo.email} | Site: {companyInfo.website}
          </Text>
        </View>
      </View>

      {/* Destaque para OS e Número do Pedido */}
      <View style={styles.osContainer}>
        <Text style={styles.osTitle}>
          O.S.: {data.serviceOrder || "-"}
        </Text>
        {data._id && (
          <Text style={styles.orderNumber}>Pedido #: {data._id.substring(0, 8)}</Text>
        )}
      </View>

      {/* Layout em duas colunas para dados do cliente e detalhes do pedido */}
      <View style={styles.rowContainer}>
        <View style={styles.columnHalf}>
          <ClientDataSection customer={customer} />
        </View>
        <View style={styles.columnHalf}>
          <OrderDetailsSection data={data} />
        </View>
      </View>

      {/* Layout em duas colunas para produtos e receita */}
      <View style={styles.rowContainer}>
        <View style={styles.columnHalf}>
          <ProductsSection data={data} isClientVersion={false} />
        </View>
      </View>

      {/* Observações (se houver) */}
      {hasObservations && (
        <View style={[styles.sectionBox, { padding: 4 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 2, padding: 2 }]}>OBSERVAÇÕES</Text>
          <Text style={styles.value}>{data.observations}</Text>
        </View>
      )}

      {/* Assinatura do Responsável */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Assinatura do responsável</Text>
      </View>

      {/* Avisos e Informativos */}
      <Text style={styles.informative}>
        O pedido poderá ser entregue em até 30 (trinta) dias úteis.
      </Text>

      <Text style={styles.informative}>
        Este documento é um comprovante de pedido. Para mais informações entre
        em contato com {companyInfo.name} pelo telefone {companyInfo.phone} ou pelo WhatsApp {companyInfo.whatsapp}.
      </Text>

      <Text style={styles.informative}>
        Consulte o status do seu pedido através do site app.oticasqueiroz.com.br.
        Para acessar, basta fazer o login com o seu CPF cadastrado e sua senha são os 6 primeiro dígitos do CPF.
      </Text>
    </View>
  );
};

// Componente para a 2ª Via - Loja (sem cabeçalho)
const StoreOrderSection = ({ data, customer }: OrderPDFProps) => {
  const hasObservations = !!data.observations && data.observations.trim() !== '';
  
  return (
    <View>
      <Text style={styles.via}>2ª VIA - LOJA</Text>
      
      {/* Destaque para OS e Número do Pedido */}
      <View style={styles.osContainer}>
        <Text style={styles.osTitle}>
          O.S.: {data.serviceOrder || "-"}
        </Text>
        {data._id && (
          <Text style={styles.orderNumber}>Pedido #: {data._id.substring(0, 8)}</Text>
        )}
      </View>

      {/* Layout em duas colunas para dados do cliente e detalhes do pedido */}
      <View style={styles.rowContainer}>
        <View style={styles.columnHalf}>
          <ClientDataSection customer={customer} />
        </View>
        <View style={styles.columnHalf}>
          <OrderDetailsSection data={data} />
        </View>
      </View>

      {/* Layout em duas colunas para produtos e receita */}
      <View style={styles.rowContainer}>
        <View style={styles.columnHalf}>
          <ProductsSection data={data} isClientVersion={false} />
        </View>
        <View style={styles.columnHalf}>
          <PrescriptionSection data={data} />
        </View>
      </View>

      {/* Observações (se houver) - com altura reduzida */}
      {hasObservations && (
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
          <Text style={styles.value}>{data.observations}</Text>
        </View>
      )}

      {/* Assinatura do Cliente */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Assinatura do Cliente</Text>
      </View>
    </View>
  );
};

// Componente principal do PDF com duas vias
export const OrderCompactPDF = ({ data, customer }: OrderPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1ª Via - Cliente */}
        <ClientOrderSection data={data} customer={customer} />
        
        {/* Linha divisória entre as vias */}
        <View style={styles.divider} />
        
        {/* 2ª Via - Loja (mais compacta) */}
        <StoreOrderSection data={data} customer={customer} />
      </Page>
    </Document>
  );
};