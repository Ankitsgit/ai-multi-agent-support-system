// ==============================================
// DATABASE SEED - Realistic mock data
// Run: npm run db:seed  (from apps/backend)
// ==============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.fAQ.deleteMany();

  // ---- SEED ORDERS ----
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        userId: 'user_demo',
        status: 'shipped',
        trackingNumber: 'TRK-9876543210',
        totalAmount: 299.99,
        currency: 'USD',
        items: [
          { name: 'Wireless Noise-Canceling Headphones', quantity: 1, price: 249.99 },
          { name: 'USB-C Cable Pack', quantity: 2, price: 24.99 },
        ],
        shippingAddress: '123 Main St, San Francisco, CA 94105',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-002',
        userId: 'user_demo',
        status: 'delivered',
        trackingNumber: 'TRK-1234567890',
        totalAmount: 89.50,
        currency: 'USD',
        items: [
          { name: 'Mechanical Keyboard', quantity: 1, price: 89.50 },
        ],
        shippingAddress: '123 Main St, San Francisco, CA 94105',
        estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-003',
        userId: 'user_demo',
        status: 'pending',
        totalAmount: 49.99,
        currency: 'USD',
        items: [
          { name: 'Phone Case', quantity: 1, price: 29.99 },
          { name: 'Screen Protector Pack', quantity: 1, price: 19.99 },
        ],
        shippingAddress: '123 Main St, San Francisco, CA 94105',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-004',
        userId: 'user_demo',
        status: 'cancelled',
        totalAmount: 150.00,
        currency: 'USD',
        items: [
          { name: 'Smart Watch', quantity: 1, price: 150.00 },
        ],
        shippingAddress: '123 Main St, San Francisco, CA 94105',
      },
    }),
  ]);

  console.log(`✅ Created ${orders.length} orders`);

  // ---- SEED PAYMENTS ----
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        paymentNumber: 'PAY-001',
        userId: 'user_demo',
        orderId: orders[0].id,
        amount: 299.99,
        currency: 'USD',
        status: 'completed',
        method: 'credit_card',
        invoiceUrl: 'https://example.com/invoices/PAY-001.pdf',
        refundStatus: 'none',
      },
    }),
    prisma.payment.create({
      data: {
        paymentNumber: 'PAY-002',
        userId: 'user_demo',
        orderId: orders[1].id,
        amount: 89.50,
        currency: 'USD',
        status: 'completed',
        method: 'paypal',
        invoiceUrl: 'https://example.com/invoices/PAY-002.pdf',
        refundStatus: 'none',
      },
    }),
    prisma.payment.create({
      data: {
        paymentNumber: 'PAY-003',
        userId: 'user_demo',
        orderId: orders[2].id,
        amount: 49.99,
        currency: 'USD',
        status: 'pending',
        method: 'credit_card',
        refundStatus: 'none',
      },
    }),
    prisma.payment.create({
      data: {
        paymentNumber: 'PAY-004',
        userId: 'user_demo',
        orderId: orders[3].id,
        amount: 150.00,
        currency: 'USD',
        status: 'refunded',
        method: 'credit_card',
        invoiceUrl: 'https://example.com/invoices/PAY-004.pdf',
        refundStatus: 'completed',
        refundAmount: 150.00,
        refundReason: 'Order cancelled by customer',
      },
    }),
    prisma.payment.create({
      data: {
        paymentNumber: 'PAY-SUB-001',
        userId: 'user_demo',
        amount: 19.99,
        currency: 'USD',
        status: 'completed',
        method: 'credit_card',
        invoiceUrl: 'https://example.com/invoices/PAY-SUB-001.pdf',
        refundStatus: 'none',
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // ---- SEED FAQs ----
  const faqs = await Promise.all([
    prisma.fAQ.create({
      data: {
        category: 'shipping',
        question: 'How long does standard shipping take?',
        answer: 'Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business days, and overnight shipping for next-day delivery.',
        tags: ['shipping', 'delivery', 'time'],
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'returns',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for all items. Products must be in original condition and packaging. To initiate a return, contact our support team with your order number.',
        tags: ['returns', 'refund', 'policy'],
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'account',
        question: 'How do I reset my password?',
        answer: 'To reset your password, click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. The link expires after 24 hours.',
        tags: ['password', 'account', 'login', 'reset'],
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'product',
        question: 'Do your electronics come with a warranty?',
        answer: 'Yes! All electronics come with a 1-year manufacturer warranty. We also offer extended warranty plans for 2 or 3 years at checkout.',
        tags: ['warranty', 'electronics', 'product'],
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'shipping',
        question: 'Do you offer international shipping?',
        answer: 'Yes, we ship to over 50 countries. International shipping takes 10-21 business days. Import duties and taxes may apply.',
        tags: ['international', 'shipping', 'global'],
      },
    }),
    prisma.fAQ.create({
      data: {
        category: 'returns',
        question: 'How do I track my refund?',
        answer: 'Once your return is received and inspected, refunds are processed within 3-5 business days. Funds will appear in your account within 5-10 business days depending on your bank.',
        tags: ['refund', 'return', 'tracking'],
      },
    }),
  ]);

  console.log(`✅ Created ${faqs.length} FAQs`);

  // ---- SEED SAMPLE CONVERSATION ----
  const conversation = await prisma.conversation.create({
    data: {
      userId: 'user_demo',
      title: 'Order Status Inquiry',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'user',
        content: 'Where is my order ORD-001?',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Your order ORD-001 has been shipped! Tracking number: TRK-9876543210. Estimated delivery in 2 days.',
        agentType: 'order',
        routingReason: 'Query references order number',
      },
    ],
  });

  console.log('✅ Created sample conversation');
  console.log('');
  console.log('🎉 Database seeded!');
  console.log('');
  console.log('📋 Demo data:');
  console.log('   User ID : user_demo');
  console.log('   Orders  : ORD-001 (shipped), ORD-002 (delivered), ORD-003 (pending), ORD-004 (cancelled)');
  console.log('   Tracking: TRK-9876543210  (for ORD-001)');
  console.log('   Payments: PAY-001 through PAY-SUB-001');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
