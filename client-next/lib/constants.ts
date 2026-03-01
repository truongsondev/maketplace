import { Product, Category, Color } from "@/types/product";

export const COLORS: Color[] = [
  { name: "Mint Green", value: "#E0F2F1", textColor: "text-teal-800" },
  { name: "Soft Pink", value: "#FCE4EC", textColor: "text-pink-800" },
  { name: "Electric Blue", value: "#E3F2FD", textColor: "text-blue-800" },
  { name: "Black", value: "#1F2937", textColor: "text-white" },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Oversized Wool Coat",
    color: "Natural Beige",
    price: 129,
    badge: "New",
    badgeColor: "bg-white text-black",
    image:
      "https://images.unsplash.com/photo-1539533057440-7bf05ba36dd3?w=400&h=600&fit=crop",
  },
  {
    id: 2,
    name: "Graphic Print Tee",
    color: "White / Black",
    price: 28,
    originalPrice: 35,
    badge: "-20%",
    badgeColor: "bg-red-500 text-white",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",
  },
  {
    id: 3,
    name: "Vintage Denim Jacket",
    color: "Light Blue",
    price: 89,
    badgeColor: "bg-neutral-500 text-white",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=600&fit=crop",
  },
  {
    id: 4,
    name: "Minimalist Blazer",
    color: "Charcoal",
    price: 145,
    badge: "Sale",
    badgeColor: "bg-primary text-white",
    image:
      "https://images.unsplash.com/photo-1591047990975-e7742caad000?w=400&h=600&fit=crop",
  },
];

export const CATEGORIES: Category[] = [
  {
    name: "Tops",
    count: "120+",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
  },
  {
    name: "Bottoms",
    count: "85+",
    image:
      "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=400&h=600&fit=crop",
  },
  {
    name: "Accessories",
    count: "50+",
    image:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=600&fit=crop",
  },
  {
    name: "Shoes",
    count: "40+",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=600&fit=crop",
  },
];
