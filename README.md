# Prototype CRM Thang Máy Vàng

Mở **[prototype.html](prototype.html)** trực tiếp bằng Edge/Chrome. Không cần cài dependency hoặc chạy backend. Tài liệu phạm vi gốc vẫn ở [index.html](index.html), có liên kết mở prototype ở đầu trang.

## Phạm vi layout

Đã dựng khung giao diện cho đủ **16 phân hệ**, đồng thời đối chiếu **208 mã tính năng** và giai đoạn triển khai từ tài liệu gốc trong `features.js`.

| Phân hệ | Layout chính |
| --- | --- |
| 01. Tổng quan | KPI, biểu đồ, cảnh báo, công việc trong ngày |
| 02. Khách hàng | Danh sách, bộ lọc, chi tiết, biểu mẫu khách hàng |
| 03. Kinh doanh | Pipeline 4 giai đoạn, danh sách báo giá/khảo sát |
| 04. Công trình & thang máy | Danh sách thiết bị, thông số, trạng thái, hồ sơ |
| 05. Hợp đồng | Danh sách, giá trị, hiệu lực, cảnh báo gia hạn |
| 06. Bảo trì | Lịch tháng, chuyển tháng, đặt lịch, danh sách lịch |
| 07. Sự cố & cứu hộ | Bảng tiếp nhận, ưu tiên, SLA minh họa, phân công |
| 08. Điều phối | Bảng 4 trạng thái, danh sách, chỉnh sửa phân công |
| 09. Kỹ thuật viên | Danh sách nhân sự và layout mobile check-in/checklist/check-out |
| 10. Kiểm định & bảo hành | Hồ sơ an toàn, mốc kiểm định, hiệu lực |
| 11. Kho vật tư | Tồn kho, vị trí, cảnh báo tồn tối thiểu |
| 12. Tài chính | Khoản thanh toán, công nợ, ngày đến hạn |
| 13. Chăm sóc | Lịch sử, kênh liên hệ, bản nháp thông báo |
| 14. Báo cáo | KPI mẫu theo tháng, biểu đồ, hiệu suất nhân sự, in PDF |
| 15. Tài liệu | Thư mục mẫu, danh sách và thông tin tài liệu |
| 16. Quản trị | Cấu hình tổ chức, SLA, thông báo, ma trận vai trò |

Mỗi phân hệ có **Phạm vi tính năng**: tìm mã/tên, mở bố cục thông tin đề xuất và lưu ghi chú duyệt layout. Các mục này dùng template theo nhóm trường dữ liệu, **chưa phải 208 màn hình nghiệp vụ được thiết kế chi tiết độc lập**.

## Luồng có thể thử

- Điều hướng qua sidebar hoặc URL `prototype.html#06` (mã 01–16).
- Tìm/lọc danh sách; tạo, sửa, đổi trạng thái và xóa bản ghi mẫu.
- Mở thẻ pipeline/điều phối, chỉnh sửa trạng thái để chuyển cột.
- Tạo lịch với ngày cụ thể, kiểm tra lịch tháng tương ứng.
- Check-in mô phỏng → đánh dấu đủ checklist → check-out; nút hoàn tất chỉ mở khi đủ điều kiện.
- Lưu cấu hình và ma trận quyền mẫu; xuất danh sách đang lọc ra CSV.
- Chuyển kỳ KPI báo cáo; dùng hộp thoại in của trình duyệt để lưu PDF.
- Ghi chú duyệt từng mã tính năng; tải lại trang để kiểm tra lưu trữ.

## Quy ước thiết kế

- Sidebar theo nhóm nghiệp vụ, topbar breadcrumb, tiêu đề và thao tác chính, tab chế độ xem, vùng nội dung.
- Màu vàng nhận diện thương hiệu; xanh cho hoàn thành/hiệu lực; đỏ cho cảnh báo; nền trắng/ngà.
- Desktop: sidebar cố định, dashboard dạng lưới; mobile: menu thu gọn, nội dung một cột, bảng và lịch cuộn trong vùng riêng.
- Modal chi tiết và biểu mẫu dùng chung; bộ lọc có trạng thái không tìm thấy; form có kiểm tra trường bắt buộc.

## Giới hạn prototype

Dữ liệu giả lập phục vụ duyệt UI/UX, lưu bằng `localStorage` với khóa `evl-prototype-v1`. Dashboard và biểu đồ là dữ liệu minh họa độc lập, không tổng hợp từ các bản ghi được chỉnh sửa. Cấu hình trong prototype chưa được áp dụng như quy tắc nghiệp vụ thực tế.

Chưa có backend, đăng nhập/RBAC thực, GPS, chữ ký, tải tệp, gửi Zalo/email, tích hợp kế toán, đồng bộ/offline, tự sinh lịch, SLA chạy thời gian thực hoặc sao lưu. Các trường trên hộp thoại tính năng chỉ minh họa layout; chỉ **ghi chú duyệt layout** được lưu từ hộp thoại đó. Không có dữ liệu gửi ra ngoài.

## Kiểm tra

```powershell
node --check prototype.js
node --check features.js
node verify-prototype.mjs
```

`verify-prototype.mjs` sử dụng Edge headless cài sẵn trên Windows, máy chủ loopback tạm và profile riêng; không cần thư viện ngoài. Có thể đặt `EDGE_PATH` nếu Edge ở vị trí khác. Kiểm tra 16 tuyến, ánh xạ tính năng, modal, CRUD, tìm kiếm, lưu qua tải lại, checklist, lịch và tràn ngang ở mobile. Máy chủ/browser kiểm thử được đóng sau khi chạy.

Để xuất ảnh xem trước vào `preview/`, đặt biến môi trường `CAPTURE_PREVIEW=1` trước khi chạy script.
