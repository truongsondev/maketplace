# Use Case Specification - Dang nhap

## 1. Summary

| Truong                    | Noi dung                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use Case ID               | UC-AUTH-LOGIN                                                                                                                                            |
| Use Case Name             | Dang nhap                                                                                                                                                |
| Use Case Description      | La Khach hang, toi muon dang nhap de vao trang chu, thay thong tin cua toi tren thanh header, va su dung cac chuc nang mua hang ca nhan hoa.             |
| Primary Actor             | Khach hang                                                                                                                                               |
| Supporting Actors         | He thong website ban hang, Dich vu dang nhap Google                                                                                                      |
| Trigger                   | Khach hang bam nut Dang nhap tren man hinh dang nhap                                                                                                     |
| Pre-Conditions            | (1) Khach hang da co tai khoan hoac co tai khoan Google hop le. (2) Website hoat dong binh thuong.                                                       |
| Post-Conditions (Success) | (1) Khach hang dang nhap thanh cong. (2) He thong dua khach hang ve trang chu hoac trang truoc do. (3) Ten/anh dai dien cua khach hang hien tren header. |
| Post-Conditions (Failure) | Khach hang chua dang nhap duoc, van o man hinh dang nhap va thay thong bao loi de thu lai.                                                               |

## 2. Flow

### 2.1 Basic Flow (Dang nhap bang email va mat khau)

1. Khach hang mo man hinh Dang nhap.
2. Khach hang nhap email va mat khau.
3. Khach hang bam nut Dang nhap.
4. He thong kiem tra thong tin vua nhap.
5. He thong xac nhan tai khoan ton tai va mat khau dung.
6. He thong xac nhan tai khoan dang o trang thai duoc phep dang nhap.
7. He thong dang nhap thanh cong cho khach hang.
8. He thong chuyen huong khach hang ve trang chu hoac trang dang xem truoc do.
9. Header cap nhat thong tin nguoi dung (ten, anh dai dien neu co).

### 2.2 Alternative Flows

#### A1 - Dang nhap bang Google

1. Khach hang chon Dang nhap voi Google.
2. He thong chuyen khach hang sang Google de xac thuc.
3. Khach hang dong y chia se thong tin tai khoan Google.
4. He thong nhan ket qua xac thuc tu Google.
5. He thong dang nhap thanh cong va xu ly giong luong chinh.
6. Khach hang duoc dua ve trang chu, thong tin hien tren header.

#### A2 - Khach hang da dang nhap nhung phien dang nhap het han

1. Khach hang dang thao tac thi he thong yeu cau xac nhan lai phien dang nhap.
2. He thong tu dong lam moi phien dang nhap neu hop le.
3. Khach hang tiep tuc su dung ma khong can nhap lai mat khau.
4. Neu khong the lam moi, he thong yeu cau khach hang dang nhap lai.

### 2.3 Exception Flows

#### E1 - Thieu email hoac mat khau

- Dieu kien: Khach hang bo trong email hoac mat khau.
- He thong: Hien thong bao nhap day du thong tin bat buoc.
- Ket qua: Khach hang bo sung thong tin va thu lai.

#### E2 - Email khong dung dinh dang hoac mat khau khong hop le

- Dieu kien: Email nhap sai dinh dang, mat khau khong dat yeu cau.
- He thong: Hien thong bao de khach hang sua thong tin.
- Ket qua: Khach hang chinh sua va dang nhap lai.

#### E3 - Sai thong tin dang nhap

- Dieu kien: Email hoac mat khau khong dung; tai khoan khong du dieu kien dang nhap.
- He thong: Hien thong bao chung la thong tin dang nhap chua dung.
- Ket qua: Khach hang thu lai hoac chon Quen mat khau.

#### E4 - Thu dang nhap qua nhieu lan trong thoi gian ngan

- Dieu kien: Co qua nhieu lan dang nhap that bai lien tiep.
- He thong: Tam thoi chan dang nhap va thong bao thu lai sau it phut.
- Ket qua: Giam rui ro bi tan cong doan mat khau.

#### E5 - Loi he thong tam thoi

- Dieu kien: Website gap loi ket noi hoac qua tai tam thoi.
- He thong: Hien thong bao he thong dang ban, vui long thu lai sau.
- Ket qua: Khach hang dang nhap lai sau.

## 3. Additional Information

### 3.1 Business Rules

- BR-01: Chi dang nhap thanh cong khi thong tin xac thuc dung.
- BR-02: Thong bao loi can ngan gon, de hieu, khong tiet lo chi tiet nhay cam.
- BR-03: Sau khi dang nhap thanh cong, khach hang phai thay ngay trang thai da dang nhap tren header.
- BR-04: Neu dang nhap that bai nhieu lan, he thong phai tam thoi gioi han de bao ve tai khoan.
- BR-05: Dang nhap Google va dang nhap thuong phai cho ket qua trai nghiem nhat quan.
