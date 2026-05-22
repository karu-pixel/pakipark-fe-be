import { backendApi } from '../lib/api';

export interface PaymentMethod {
  id: string | number;
  displayLabel: string;
  mobileNumber?: string;
  isDefault: boolean;
}

export const paymentMethodService = {
  async getAll(): Promise<PaymentMethod[]> { return backendApi.getPaymentMethods(); },
  async add(payload: Parameters<typeof backendApi.addPaymentMethod>[0]) { return backendApi.addPaymentMethod(payload); },
  async update(id: string, payload: Parameters<typeof backendApi.updatePaymentMethod>[1]) { return backendApi.updatePaymentMethod(id, payload); },
  async delete(id: string) { return backendApi.deletePaymentMethod(id); },
};
