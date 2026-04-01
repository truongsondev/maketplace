# VNPAY Sandbox Integration (Server + Client)

## 1) Chay local

### Server

1. Tao file env tu `.env.example`:
   - `VNPAY_TMN_CODE`
   - `VNPAY_HASH_SECRET`
   - `VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
   - `VNPAY_RETURN_URL`
   - `VNPAY_IPN_URL`
2. Chay migration + generate:
   - `npx prisma migrate dev --name add_vnpay_payment_transaction`
   - `npx prisma generate`
3. Start server: `npm run dev`

### Client

1. Tao `.env.local` tu `.env.example` va set:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
2. Start client: `npm run dev`

## 2) Flow test sandbox

1. Dang nhap user.
2. Vao trang cart, bam `PAY WITH VNPAY`.
3. He thong tao order PENDING + payment transaction PENDING, sau do redirect sang VNPAY sandbox.
4. Sau khi thanh toan, VNPAY redirect ve Return URL.
5. Return page goi server de:
   - verify checksum (chi doc ket qua, KHONG update DB)
   - lay trang thai don hang tu DB (uu tien ket qua da duoc IPN cap nhat)

## 3) Test IPN local bang ngrok

1. Chay backend local (`http://localhost:8080`).
2. Expose port 8080:
   - `ngrok http 8080`
3. Lay URL https tu ngrok, vi du:
   - `https://abc123.ngrok-free.app`
4. Set env:
   - `VNPAY_RETURN_URL=https://abc123.ngrok-free.app/payment/vnpay/return`
   - `VNPAY_IPN_URL=https://abc123.ngrok-free.app/api/payments/vnpay/ipn`
5. Restart server va test lai flow thanh toan.

## 4) Ma phan hoi IPN

- `{"RspCode":"00","Message":"Confirm Success"}`
- `{"RspCode":"01","Message":"Order not found"}`
- `{"RspCode":"02","Message":"Order already confirmed"}`
- `{"RspCode":"04","Message":"invalid amount"}`
- `{"RspCode":"97","Message":"Invalid signature"}`
- `{"RspCode":"99","Message":"Invalid request"}`

## 5) Test cases da them

- Tao URL thanh cong: `create-vnpay-payment-url.usecase.test.ts`
- Verify chu ky thanh cong/that bai: `vnpay-signature.test.ts`
- IPN thanh cong: `handle-vnpay-ipn.usecase.test.ts`
- IPN callback duplicate: `handle-vnpay-ipn.usecase.test.ts`
- IPN amount mismatch: `handle-vnpay-ipn.usecase.test.ts`
