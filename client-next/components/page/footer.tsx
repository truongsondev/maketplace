export function Footer() {
  return (
    <footer className="mt-auto bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid w-full max-w-330 grid-cols-2 gap-5 px-4 py-6 text-sm sm:grid-cols-4 md:px-6 lg:px-8">
          <div>
            <p className="text-lg font-black uppercase">Miễn phí ship</p>
            <p className="text-white/70">Toàn quốc</p>
          </div>
          <div>
            <p className="text-lg font-black uppercase">Bảo hành</p>
            <p className="text-white/70">365 ngày</p>
          </div>
          <div>
            <p className="text-lg font-black uppercase">Địa chỉ</p>
            <p className="text-white/70">Hệ thống cửa hàng Aura VN</p>
          </div>
          <div>
            <p className="text-lg font-black uppercase">Tạp chí</p>
            <p className="text-white/70">Thông tin thời trang mới</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-330 grid-cols-2 gap-x-8 gap-y-10 px-4 py-10 text-sm md:grid-cols-5 md:px-6 lg:px-8">
        <div>
          <h3 className="text-2xl font-black uppercase">Quần áo</h3>
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
          <h3 className="text-2xl font-black uppercase">Phụ kiện</h3>
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
          <h3 className="text-2xl font-black uppercase">Trang phục</h3>
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
          <h3 className="text-2xl font-black uppercase">Chính sách</h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Vận chuyển</li>
            <li>Thanh toán</li>
            <li>Đổi trả</li>
            <li>Bảo hành</li>
            <li>Cửa hàng</li>
            <li>Khiếu nại</li>
          </ul>
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase">Cộng đồng</h3>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Facebook</li>
            <li>TikTok</li>
            <li>YouTube</li>
            <li>Instagram</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 py-4">
        <div className="mx-auto w-full max-w-330 px-4 text-xs text-white/50 md:px-6 lg:px-8">
          © 2026 AURA FASHION. Mọi quyền được bảo lưu. Hotline: (028) 7000 1441 | Email:
          support@aura.vn
        </div>
      </section>
    </footer>
  );
}
