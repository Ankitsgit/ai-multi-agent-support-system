// ==============================================
// ORDER TOOLS - Real DB queries for Order Agent
// PostgreSQL returns native JSON — no parsing needed
// ==============================================

import { tool } from 'ai';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';

export const getOrderDetails = tool({
  description: 'Fetch full details of a customer order by order number (e.g. ORD-001) or order ID.',
  parameters: z.object({
    identifier: z.string().describe('Order number like ORD-001 or order ID'),
  }),
  execute: async ({ identifier }) => {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ orderNumber: identifier }, { id: identifier }],
        },
      });

      if (!order) {
        return { found: false, message: `No order found for "${identifier}". Please check the order number.` };
      }

      return {
        found: true,
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber || 'Not yet assigned',
          totalAmount: `$${order.totalAmount.toFixed(2)} ${order.currency}`,
          items: order.items,
          shippingAddress: order.shippingAddress || 'Not specified',
          estimatedDelivery: order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toDateString()
            : 'Not available',
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toDateString() : null,
          placedOn: new Date(order.createdAt).toDateString(),
        },
      };
    } catch (error) {
      console.error('[getOrderDetails]', error);
      return { found: false, message: 'Failed to retrieve order details.' };
    }
  },
});

export const checkDeliveryStatus = tool({
  description: 'Check delivery and tracking status using a tracking number like TRK-9876543210.',
  parameters: z.object({
    trackingNumber: z.string().describe('Tracking number e.g. TRK-9876543210'),
  }),
  execute: async ({ trackingNumber }) => {
    try {
      const order = await prisma.order.findFirst({ where: { trackingNumber } });

      if (!order) {
        return { found: false, message: `No shipment found for tracking number "${trackingNumber}".` };
      }

      const statusLocations: Record<string, string> = {
        pending: 'Awaiting processing at warehouse',
        processing: 'Being prepared at fulfillment center',
        shipped: 'In transit — Regional Distribution Center',
        delivered: 'Delivered to destination',
        cancelled: 'Order cancelled',
      };

      return {
        found: true,
        tracking: {
          trackingNumber,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          currentLocation: statusLocations[order.status] || 'Unknown',
          estimatedDelivery: order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toDateString()
            : 'Not available',
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toDateString() : null,
        },
      };
    } catch (error) {
      console.error('[checkDeliveryStatus]', error);
      return { found: false, message: 'Failed to retrieve tracking info.' };
    }
  },
});

export const listUserOrders = tool({
  description: 'List all orders for the current user. Use when asked about order history.',
  parameters: z.object({
    userId: z.string().describe('User ID to fetch orders for'),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'all']).optional(),
  }),
  execute: async ({ userId, status }) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          userId,
          ...(status && status !== 'all' ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      if (orders.length === 0) {
        return { found: false, message: 'No orders found for this account.' };
      }

      return {
        found: true,
        totalOrders: orders.length,
        orders: orders.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: `$${o.totalAmount.toFixed(2)}`,
          itemCount: Array.isArray(o.items) ? (o.items as any[]).length : 0,
          placedOn: new Date(o.createdAt).toDateString(),
          trackingNumber: o.trackingNumber || 'N/A',
        })),
      };
    } catch (error) {
      console.error('[listUserOrders]', error);
      return { found: false, message: 'Failed to retrieve orders.' };
    }
  },
});
