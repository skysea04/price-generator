export interface ServiceItem {
  category: string;
  item: string;
  price: number;
  count: number;
  unit: string;
  amount: number;
}

export interface QuotationData {
  quotationName: string;
  logo?: string;
  company: string;
  customerTaxID?: string;
  quoterName: string;
  quoterTaxID?: string;
  email: string;
  tel?: string;
  startDate?: string;
  endDate?: string;
  serviceItems: ServiceItem[];
  excludingTax: number;
  taxName?: string;
  percentage: number;
  tax: number;
  includingTax: number;
  desc?: string;
  isSign: boolean;
  createdAt?: string;
}