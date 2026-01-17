import { ProductCard } from "./product-card";

const products = [
  {
    title: "Premium Hi-Fi Studio Headphones with Noise Cancellation",
    price: 129.99,
    discount: 15,
    rating: 4.9,
    sold: 1200,
    location: "Singapore",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAJoaf9r-Vyrw8dr-TUfKHRKVQ7RsoX2NYvgK92HqOQPjEMW47otbYwJBgPJGstWQcqHcxho1gx8UwfQzx2jI4XEvQGYBl5htPHAKtFV9EFadCNojwN-bKBtlVnv7WJgjvgAIyFk0Q80oakX2N9Je0vQXcW_AWD_28TbmIh_YQ4PD8xkzUNmCLc1jm7vqL1_14yeFPzcJsvRTqFGSyoWsNL_rH1_g4IA_eKMf7RYdUNHSR4BFaXBHWxOkf68OZ51VROPIvvOyRMXJoj",
    preferred: true,
  },
  {
    title: "4K Ultra HD Smart TV 55 inch with HDR",
    price: 399.99,
    discount: 25,
    rating: 4.7,
    sold: 850,
    location: "Malaysia",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkL3xM2_jQrR5dJvDVQx6wDd7l8dNpE2j9aKf0vKlHqZ_aBjQkWx_xYz",
  },
  {
    title: "Wireless Mechanical Gaming Keyboard RGB",
    price: 89.99,
    discount: 20,
    rating: 4.8,
    sold: 2100,
    location: "Thailand",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkL3xM2_jQrR5dJvDVQx6wDd7l8dNpE2j9aKf0vKlHqZ_aBjQkWx_xYz",
  },
  {
    title: "Professional DSLR Camera 24MP with Lens",
    price: 599.99,
    discount: 30,
    rating: 4.9,
    sold: 450,
    location: "Vietnam",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkL3xM2_jQrR5dJvDVQx6wDd7l8dNpE2j9aKf0vKlHqZ_aBjQkWx_xYz",
    preferred: true,
  },
  {
    title: "Premium Stainless Steel Cookware Set 10pc",
    price: 179.99,
    discount: 10,
    rating: 4.6,
    sold: 1800,
    location: "Philippines",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkL3xM2_jQrR5dJvDVQx6wDd7l8dNpE2j9aKf0vKlHqZ_aBjQkWx_xYz",
  },
  {
    title: "Smart Home Security Camera System Wireless",
    price: 129.99,
    discount: 35,
    rating: 4.8,
    sold: 3200,
    location: "Indonesia",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkL3xM2_jQrR5dJvDVQx6wDd7l8dNpE2j9aKf0vKlHqZ_aBjQkWx_xYz",
    preferred: true,
  },
];

export function DailyDiscover() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between border-b-4 border-primary pb-2">
        <h3 className="text-xl font-bold uppercase tracking-wide text-primary">
          Daily Discover
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pb-20">
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
    </div>
  );
}
