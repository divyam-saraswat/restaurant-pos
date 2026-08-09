import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client (in production, use a global instance to avoid connection exhaustion)
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected { orders: [...] }' },
        { status: 400 }
      );
    }

    const syncedOrderIds: string[] = [];

    // Process orders sequentially to avoid failing the entire batch if one fails
    // Alternatively, this could be wrapped in a transaction if all-or-nothing is preferred
    for (const order of orders) {
      try {
        // Check if the order already exists to prevent duplicate processing
        const existingOrder = await prisma.order.findUnique({
          where: { id: order.id },
        });

        if (!existingOrder) {
          // Create the new order with nested writes for items and payment
          await prisma.order.create({
            data: {
              id: order.id,
              type: order.type || 'DINE_IN',
              totalAmount: order.totalAmount,
              status: order.status || 'COMPLETED',
              createdAt: new Date(order.createdAt), // Convert timestamp to Date object
              
              // Create associated OrderItems
              items: {
                create: order.items.map((item: any) => ({
                  id: item.id,
                  quantity: item.quantity,
                  unitPrice: item.price,
                  menuItem: {
                    connect: { id: item.menuItemId },
                  },
                })),
              },

              // Create associated Payment if a payment method is provided
              ...(order.paymentMethod
                ? {
                    payment: {
                      create: {
                        amount: order.totalAmount,
                        method: order.paymentMethod,
                        status: 'COMPLETED',
                      },
                    },
                  }
                : {}),
            },
          });
        }
        
        // Add to successful sync list (even if it already existed, we consider it synced)
        syncedOrderIds.push(order.id);
      } catch (orderError) {
        console.error(`Failed to sync order ${order.id}:`, orderError);
        // We continue to the next order instead of failing the whole batch
      }
    }

    return NextResponse.json({ success: true, syncedOrderIds }, { status: 200 });
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}
