export type Currency = 'USD' | 'VES' | 'USDT';

export type PaymentMethod = 'pago_movil' | 'zelle' | 'usdt' | 'cash';

export interface StoreOrganization {
  id: string;
  name: string;
  slug: string;
  currency_rate_usd_ves: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_usd_cents: number;
  stock: number;
  images: string[];
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutPayload {
  organizationId: string;
  customerName: string;
  customerPhone: string;
  customerInstagram?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  currency: Currency;
  items: {
    productId: string;
    quantity: number;
    unitPriceCents: number;
  }[];
}