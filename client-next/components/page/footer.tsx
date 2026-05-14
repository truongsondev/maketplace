export function Footer() {
  return (
    <footer className="mt-auto bg-[#0d0c0b] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid w-full max-w-330 grid-cols-2 gap-px bg-white/10 px-4 py-0 text-sm sm:grid-cols-4 md:px-6 lg:px-8">
          <div>
            <div className="bg-[#0d0c0b] py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">
                Shipping
              </p>
              <p className="mt-2 text-lg font-semibold uppercase">
                Miễn phí ship
              </p>
            </div>
          </div>
          <div>
            <div className="bg-[#0d0c0b] py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">
                Care
              </p>
              <p className="mt-2 text-lg font-semibold uppercase">
                Bảo hành 365 ngày
              </p>
            </div>
          </div>
          <div>
            <div className="bg-[#0d0c0b] py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">
                Studio
              </p>
              <p className="mt-2 text-lg font-semibold uppercase">Aura VN</p>
            </div>
          </div>
          <div>
            <div className="bg-[#0d0c0b] py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">
                Journal
              </p>
              <p className="mt-2 text-lg font-semibold uppercase">
                Fashion notes
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-330 grid-cols-2 gap-x-8 gap-y-10 px-4 py-14 text-sm md:grid-cols-5 md:px-6 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-4xl font-semibold uppercase tracking-[-0.06em]">
            AURA
          </h3>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
            Quiet luxury pieces for daily rhythm, weekend movement and modern
            workwear.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Quần áo
          </h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Áo Thun Cổ Tròn</li>
            <li>Áo Polo</li>
            <li>Áo Khoác</li>
            <li>Quần Dài</li>
            <li>Quần Short</li>
            <li>Quần Jeans</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Phụ kiện
          </h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Balo</li>
            <li>Túi đeo</li>
            <li>Nón</li>
            <li>Ví</li>
            <li>Giày</li>
            <li>Dép</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Trang phục
          </h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>BST Non-Branded</li>
            <li>BST Seven</li>
            <li>BST The Worker</li>
            <li>BST The Minimalist</li>
            <li>BST The Weekend</li>
            <li>BST Home Body</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Chính sách
          </h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Vận chuyển</li>
            <li>Thanh toán</li>
            <li>Đổi trả</li>
            <li>Bảo hành</li>
            <li>Cửa hàng</li>
            <li>Khiếu nại</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 py-4">
        <div className="mx-auto w-full max-w-330 px-4 text-xs text-white/50 md:px-6 lg:px-8">
          © 2026 AURA FASHION. Mọi quyền được bảo lưu. Hotline: (028) 7000 1441
          | Email: support@aura.vn
        </div>
      </section>
    </footer>
  );
}
