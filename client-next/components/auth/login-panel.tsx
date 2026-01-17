export function LoginPanel() {
  return (
    <div className="hidden md:flex flex-1 relative bg-[#f45925]/10 overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col justify-center p-12">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#181311] dark:text-white leading-tight mb-6">
          Trải nghiệm cách mua sắm trực tuyến tốt nhất
        </h1>
        <p className="text-lg text-[#8a6b60] dark:text-[#d1c2bc] mb-8 max-w-md">
          Tham gia cùng hàng triệu người mua và người bán trên khắp khu vực. An
          toàn, nhanh chóng và đáng tin cậy.
        </p>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <svg
              className="w-5 h-5 text-[#f45925]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span className="text-sm font-semibold dark:text-white">
              100% Secure
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <svg
              className="w-5 h-5 text-[#f45925]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
            <span className="text-sm font-semibold dark:text-white">
              Fast Delivery
            </span>
          </div>
        </div>
      </div>
      {/* Background Image */}
      <div className="absolute bottom-0 right-0 w-3/4 h-3/4 opacity-40 md:opacity-100">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent, rgba(244, 89, 37, 0.1)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDm-4IXwmYpsD_YFsxdz73ApJ_0VLzHc_Vm84TBpghWf_X7VdRsJVDVq-e1dRUA_UuACf5H6PKYKjl4j7cGVY-c376QfArQpP1GjlqA4w-6wyiFpJpCKLpfMygQE8Y_7-DcYW5UAi8XiEys3PGr_ZX5LG3pYKy82rO7IrR0fzeSF9Db6IBF16rK8IUhxMpi5maG_Y8fwiMS5nlvxdRcibv9msXEHqcLcIsrtl0kl-gRsRUo-8kfrLQCJVkhWeuoB8s5Cc5yOmARLJuD")',
          }}
        ></div>
      </div>
    </div>
  );
}
