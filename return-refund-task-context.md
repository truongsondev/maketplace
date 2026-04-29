# Return/Refund Feature Context

## Goal

Implement client/admin return and refund request flow from `ft.promt.md`.

## Existing Flow Found

- Client endpoint already exists: `POST /api/orders/:orderId/return`.
- Existing backend creates `Return` rows per `OrderItem` and updates `Order.returnStatus`.
- Admin order page already has actions for approve/reject/complete return.
- Admin notification flow stores rows in `notifications`; admin header parses notification text to navigate to `/orders`.
- Client already has Cloudinary upload support through review image upload signatures.

## Required Additions

- Client return form should be a modal similar to paid cancel request modal.
- Return reasons:
  - `WRONG_MODEL`: Không đúng mẫu
  - `WRONG_SIZE`: Không vừa, muốn đổi size
  - `DEFECTIVE`: Hàng bị lỗi
- Return request requires evidence images.
- Return request also collects bank account name, number, and bank name.
- Admin receives notification for return request.
- Admin order modal displays phone, pickup address, reason, bank info, evidence images, and approve/reject buttons.

## Data Approach

- Extend existing `returns` table with nullable columns for reason code, bank account info, and evidence image JSON.
- Keep existing `Return.reason` text for human-readable/free text compatibility.
- Store evidence images as JSON array of `{ url, publicId? }`.

## Migration Note

- Add nullable columns only; existing rows remain valid.
- Rollback can drop the added columns from `returns`.
