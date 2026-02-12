// ==============================================
// BILLING TOOLS - Real DB queries for Billing Agent
// Handles payments, refunds, invoices
// ==============================================

import { tool } from 'ai';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';

/**
 * Tool: Get invoice / payment details
 */
export const getInvoiceDetails = tool({
  description: 'Fetch details of a payment or invoice by payment number or order number. Use when customer asks about charges, receipts, or invoices.',
  parameters: z.object({
    identifier: z.string().describe('Payment number (PAY-001), order number (ORD-001), or payment ID'),
  }),
  execute: async ({ identifier }) => {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { paymentNumber: identifier },
            { id: identifier },
            { orderId: identifier },
          ],
        },
      });

      if (!payment) {
        // Try finding by order number
        const order = await prisma.order.findFirst({
          where: { orderNumber: identifier },
        });

        if (order) {
          const paymentByOrder = await prisma.payment.findFirst({
            where: { orderId: order.id },
          });

          if (paymentByOrder) {
            return formatPaymentResponse(paymentByOrder);
          }
        }

        return {
          found: false,
          message: `No invoice found for "${identifier}". Please check the order or payment number.`,
        };
      }

      return formatPaymentResponse(payment);
    } catch (error) {
      console.error('[getInvoiceDetails] Error:', error);
      return { found: false, message: 'Failed to retrieve invoice details.' };
    }
  },
});

/**
 * Tool: Check refund status
 */
export const checkRefundStatus = tool({
  description: 'Check the status of a refund request. Use when customer asks about their refund.',
  parameters: z.object({
    identifier: z.string().describe('Payment number, order number, or payment ID to check refund for'),
  }),
  execute: async ({ identifier }) => {
    try {
      // Find by payment number, order number, or ID
      let payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { paymentNumber: identifier },
            { id: identifier },
          ],
        },
      });

      if (!payment) {
        const order = await prisma.order.findFirst({
          where: { orderNumber: identifier },
        });
        if (order) {
          payment = await prisma.payment.findFirst({ where: { orderId: order.id } });
        }
      }

      if (!payment) {
        return {
          found: false,
          message: `No payment found for "${identifier}".`,
        };
      }

      const refundMessages: Record<string, string> = {
        none: 'No refund has been requested for this payment.',
        requested: 'Your refund request has been received and is awaiting review. This typically takes 1-2 business days.',
        processing: 'Your refund is being processed. Funds will be returned within 3-5 business days.',
        completed: `Your refund of $${payment.refundAmount?.toFixed(2) || payment.amount.toFixed(2)} has been completed. It may take 5-10 business days to appear in your account depending on your bank.`,
      };

      return {
        found: true,
        paymentNumber: payment.paymentNumber,
        originalAmount: `$${payment.amount.toFixed(2)} ${payment.currency}`,
        refundStatus: payment.refundStatus,
        refundAmount: payment.refundAmount ? `$${payment.refundAmount.toFixed(2)}` : null,
        refundReason: payment.refundReason || null,
        statusMessage: refundMessages[payment.refundStatus] || 'Unknown refund status.',
        paymentMethod: payment.method,
      };
    } catch (error) {
      console.error('[checkRefundStatus] Error:', error);
      return { found: false, message: 'Failed to retrieve refund status.' };
    }
  },
});

/**
 * Tool: List all payments/transactions for a user
 */
export const listUserPayments = tool({
  description: 'List all payments and transactions for the current user. Use when customer asks about billing history or charges.',
  parameters: z.object({
    userId: z.string().describe('The user ID to fetch payments for'),
  }),
  execute: async ({ userId }) => {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (payments.length === 0) {
        return { found: false, message: 'No payment history found for this account.' };
      }

      const totalSpent = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        found: true,
        totalTransactions: payments.length,
        totalSpent: `$${totalSpent.toFixed(2)}`,
        payments: payments.map((p) => ({
          paymentNumber: p.paymentNumber,
          amount: `$${p.amount.toFixed(2)} ${p.currency}`,
          status: p.status,
          method: p.method,
          date: p.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          invoiceUrl: p.invoiceUrl || 'N/A',
          refundStatus: p.refundStatus !== 'none' ? p.refundStatus : null,
        })),
      };
    } catch (error) {
      console.error('[listUserPayments] Error:', error);
      return { found: false, message: 'Failed to retrieve payment history.' };
    }
  },
});

// ---- Helper ----
function formatPaymentResponse(payment: any) {
  return {
    found: true,
    invoice: {
      paymentNumber: payment.paymentNumber,
      amount: `$${payment.amount.toFixed(2)} ${payment.currency}`,
      status: payment.status,
      paymentMethod: payment.method,
      date: payment.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      invoiceUrl: payment.invoiceUrl || null,
      refundStatus: payment.refundStatus,
    },
  };
}
