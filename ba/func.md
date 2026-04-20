# Danh sach toan bo chuc nang he thong Maketplace

Tai lieu nay tong hop chuc nang theo module backend thuc te (server/src/app.ts) va domain hien co.

## 1. Public / Guest

### 1.1 Kiem tra he thong

- Health check server.

### 1.2 Catalog public

- Xem danh sach san pham public.
- Xem thong ke danh muc.
- Xem category showcases cho trang chu.
- Xem home team content cho trang chu.
- Xem chi tiet san pham.

### 1.3 Du lieu dung chung

- Xem danh sach categories.
- Xem danh sach tags.
- Xem product type schema.

### 1.4 Banner, voucher, dia diem (public)

- Xem banner dang hoat dong.
- Xem voucher dang hoat dong.
- Xem danh sach tinh/thanh.
- Xem danh sach phuong/xa theo tinh.

## 2. Nguoi dung da dang nhap (Buyer)

### 2.1 Auth va tai khoan

- Dang ky tai khoan.
- Xac minh email.
- Dang nhap.
- Dang xuat.
- Quen mat khau.
- Dat lai mat khau.
- Lam moi token (refresh token).
- Dang nhap bang Google OAuth (start/callback/exchange).

### 2.2 Dia chi giao hang

- Lay danh sach dia chi cua toi.
- Lay dia chi su dung gan nhat.

### 2.3 Wishlist / Favorites

- Xem san pham yeu thich.
- Them san pham vao yeu thich.
- Xoa san pham khoi yeu thich.

### 2.4 Gio hang

- Xem chi tiet gio hang.
- Xem tom tat gio hang (tong so luong/tong gia).
- Them variant vao gio hang.
- Cap nhat so luong item trong gio.
- Xoa item khoi gio.

### 2.5 Voucher (private)

- Xem voucher dang hoat dong.
- Validate voucher theo gio hang.
- Apply voucher cho gio hang/checkout.

### 2.6 Don hang cua toi

- Xem danh sach don hang cua toi (filter/tab/sort/paging).
- Xem so luong don theo trang thai.
- Xem chi tiet don hang.
- Huy don hang (truong hop cho phep).
- Gui yeu cau huy don da thanh toan (kem thong tin ngan hang).
- Xac nhan da nhan hang.
- Tao yeu cau tra hang.

### 2.7 Thong bao cua toi

- Xem danh sach thong bao.
- Danh dau da doc tung thong bao.
- Danh dau da doc tat ca thong bao.

### 2.8 Danh gia san pham

- Lay chu ky upload anh review (Cloudinary sign).
- Kiem tra trang thai co the review theo order.
- Tao review (rating/comment/images).

### 2.9 Thanh toan

- Tao link thanh toan PayOS.
- Xu ly return URL tu PayOS.
- Xu ly webhook PayOS.
- Tra cuu trang thai thanh toan theo orderCode.

## 3. Admin

### 3.1 Admin auth

- Dang nhap admin (chi user co role ADMIN).

### 3.2 Quan tri san pham

- Xem danh sach san pham admin (filter/search/sort/paging).
- Export danh sach san pham ra CSV.
- Xem chi tiet san pham.
- Tao san pham.
- Cap nhat san pham.
- Xoa mem san pham.
- Khoi phuc san pham da xoa.
- Xoa hang loat san pham.

### 3.3 Quan tri bien the va ton kho

- Tao variant cho san pham.
- Cap nhat variant.
- Xoa variant.
- Dieu chinh ton kho variant (import/export/adjustment).
- Xem lich su bien dong ton kho (inventory logs).

### 3.4 Quan tri category/tag va tac vu hang loat

- Xem categories de gan cho san pham.
- Xem tags de gan cho san pham.
- Gan category hang loat cho nhieu san pham (append/replace).
- Gan tag hang loat cho nhieu san pham (append/replace).

### 3.5 Quan tri media san pham

- Tao chu ky upload anh (Cloudinary sign).
- Luu anh san pham/anh variant.
- Xoa anh san pham.

### 3.6 Analytics san pham

- Xem top san pham ban chay.
- Xem top san pham duoc yeu thich.
- Xem san pham it duoc mua.

### 3.7 Quan tri don hang

- Xem danh sach don hang.
- Export don hang.
- Xem counts don hang theo trang thai.
- Xem analytics trang thai don hang.
- Xem analytics timeseries don hang.
- Huy don hang boi admin.
- Kiem tra kha nang xac nhan don.
- Xac nhan don.
- Chuyen don sang dang giao (ship).
- Danh dau da giao (deliver).

### 3.8 Quan tri yeu cau huy don da thanh toan

- Duyet yeu cau huy don.
- Tu choi yeu cau huy don.
- Hoan tat hoan tien cho yeu cau huy don.

### 3.9 Quan tri tra hang/hoan tien

- Duyet yeu cau tra hang.
- Tu choi yeu cau tra hang.
- Danh dau da lay hang tra.
- Hoan tat quy trinh tra hang.

### 3.10 Dashboard

- Xem dashboard overview.
- Xem dashboard timeseries.
- Xem don hang gan day.

### 3.11 Users management

- Xem danh sach users.
- Export users ra CSV.
- Xem chi tiet user.
- Cap nhat trang thai user (active/suspended/banned).
- Cap nhat role user (admin/buyer).
- Xem lich su audit cua user.
- Xem analytics customer cohorts.
- Xem analytics top spenders.

### 3.12 Vouchers management

- Xem danh sach vouchers.
- Xem chi tiet voucher.
- Tao voucher.
- Cap nhat voucher.
- Bat/tat trang thai voucher.

### 3.13 Banners management

- Xem danh sach banners.
- Xem chi tiet banner.
- Tao banner.
- Cap nhat banner.
- Bat/tat trang thai banner.
- Tao chu ky upload banner.

### 3.14 Refunds management

- Xem danh sach refund transactions.
- Xem chi tiet refund transaction.
- Retry refund that bai.

### 3.15 Audit logs

- Tra cuu audit logs theo bo loc (actor/action/target/time).

### 3.16 Admin notifications

- Xem danh sach thong bao admin.
- Danh dau da doc tung thong bao.
- Danh dau da doc tat ca.
- Nhan thong bao realtime qua stream (SSE).

## 4. Chuc nang domain cap he thong

- RBAC voi User-Role.
- Quan ly refresh token, password reset token, email verification token, oauth account.
- Quan ly danh muc/cay danh muc, tags, product type, attributes/options.
- Quan ly product, variant, hinh anh, lich su gia.
- Quan ly cart, order, order item, payment, payment transaction.
- Quan ly discount va discount usage.
- Quan ly return flow, refund transaction, order cancel request, order status history.
- Quan ly notification, wishlist, review/review images, user activity log, audit log.

## 5. Ghi chu

- Co cac endpoint mock nghiep vu don hang de test Postman trong moi truong dev:
  - Mark delivered
  - Mark return picked up
  - Complete return
- Tat ca module admin (tru admin login) yeu cau xac thuc va role ADMIN.
