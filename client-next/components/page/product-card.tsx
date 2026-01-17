interface ProductCardProps {
  title: string;
  price: number;
  discount: number;
  rating: number;
  sold: number;
  location: string;
  image: string;
  preferred?: boolean;
}

export function ProductCard({
  title,
  price,
  discount,
  rating,
  sold,
  location,
  image,
  preferred = false,
}: ProductCardProps) {
  return (
    <div className="bg-card dark:bg-background-dark/30 rounded shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border border-transparent hover:border-primary/30 flex flex-col group overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url("${image}")` }}
        ></div>
        {preferred && (
          <div className="absolute top-1 left-1 bg-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-sm">
            Preferred
          </div>
        )}
      </div>
      <div className="p-2 flex-1 flex flex-col">
        <h4 className="text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <div className="mt-auto">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-primary font-bold">${price.toFixed(2)}</span>
            {discount > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                -{discount}%
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[10px] text-yellow-500 fill-yellow-500">
                star
              </span>
              <span className="ml-0.5">
                {rating} | {sold} sold
              </span>
            </div>
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
