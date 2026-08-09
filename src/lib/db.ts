import Dexie, { type Table } from 'dexie';

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  type: 'DINE_IN' | 'TAKEAWAY';
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI';
  createdAt: number;
}

export class POSDatabase extends Dexie {
  categories!: Table<Category, string>;
  menuItems!: Table<MenuItem, string>;
  orders!: Table<Order, string>;

  constructor() {
    super('POSDatabase');
    this.version(1).stores({
      categories: 'id, name',
      menuItems: 'id, categoryId, name',
      orders: 'id, status, createdAt',
    });
  }
}

export const db = new POSDatabase();

// Seed initial data if empty
export const seedDatabase = async () => {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const categories: Category[] = [
      { id: 'c1', name: 'Burgers', color: 'bg-orange-100 text-orange-700' },
      { id: 'c2', name: 'Pizzas', color: 'bg-red-100 text-red-700' },
      { id: 'c3', name: 'Drinks', color: 'bg-blue-100 text-blue-700' },
      { id: 'c4', name: 'Desserts', color: 'bg-pink-100 text-pink-700' },
    ];
    await db.categories.bulkAdd(categories);

    const menuItems: MenuItem[] = [
      { id: 'm1', name: 'Classic Burger', price: 8.99, categoryId: 'c1' },
      { id: 'm2', name: 'Cheese Burger', price: 9.99, categoryId: 'c1' },
      { id: 'm3', name: 'Margherita Pizza', price: 12.99, categoryId: 'c2' },
      { id: 'm4', name: 'Pepperoni Pizza', price: 14.99, categoryId: 'c2' },
      { id: 'm5', name: 'Cola', price: 2.50, categoryId: 'c3' },
      { id: 'm6', name: 'Lemonade', price: 3.00, categoryId: 'c3' },
      { id: 'm7', name: 'Ice Cream', price: 4.50, categoryId: 'c4' },
      { id: 'm8', name: 'Cheesecake', price: 5.50, categoryId: 'c4' },
    ];
    await db.menuItems.bulkAdd(menuItems);
  }
};
