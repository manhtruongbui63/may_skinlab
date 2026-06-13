# Bài 3: Kiến Trúc & Luồng Viết Backend Laravel 13 Chuẩn Mực

Dự án của chúng ta sử dụng **Laravel 13** để xây dựng API RESTful hiệu năng cao. Nhằm duy trì một codebase sạch, dễ bảo trì và dễ mở rộng khi có hàng trăm API, dự án áp dụng nghiêm ngặt kiến trúc tách lớp chuyên biệt và luồng xử lý dữ liệu một chiều.

---

## 1. 🔄 Luồng Dữ Liệu Một Chiều (Unidirectional Data Flow)

Mọi request được gửi từ Frontend Next.js lên Backend Laravel bắt buộc phải tuân theo luồng xử lý tuần tự và một chiều duy nhất như sau:

```text
Frontend Request 
       │
       ▼
 1. [ Route ] ──────────────► Khai báo endpoint & liên kết Controller
       │
       ▼
 2. [ Middleware ] ─────────► Xác thực token (Sanctum), Phân quyền, Rate limiting
       │
       ▼
 3. [ FormRequest ] ────────► Validation nghiêm ngặt (Quy tắc 3 lớp)
       │
       ▼
 4. [ Controller ] ─────────► Nhận request data ➔ Lấy Service từ ApiFactory
       │
       ▼
 5. [ DTO ] ────────────────► Đóng gói dữ liệu có định kiểu mạnh mẽ (Strongly-typed)
       │
       ▼
 6. [ Service ] ────────────► Xử lý toàn bộ logic nghiệp vụ, Database mutations, Transactions
       │
       ▼
 7. [ JsonResource ] ───────► Định dạng dữ liệu trả về (Data transformation)
       │
       ▼
Frontend Response (JSON)
```

### 1.1. Chi Tiết Trách Nhiệm Của Từng Lớp (Separation of Concerns)

1.  **Route (`routes/api.php`)**: Chỉ khai báo endpoint, liên kết với phương thức tương ứng của Controller và áp dụng các middleware bảo vệ.
2.  **Middleware**: Kiểm tra token (Laravel Sanctum), phân quyền Spatie Permission, rate limiting và reject sớm các request không hợp lệ trước khi chúng đi sâu vào hệ thống.
3.  **FormRequest (`app/Http/Requests/`)**:
    *   **Nhiệm vụ duy nhất**: Đảm bảo dữ liệu đầu vào hoàn toàn hợp lệ và sạch sẽ.
    *   **Quy tắc 3 lớp (3-Layer Validation)**: Mọi trường dữ liệu gửi lên bắt buộc phải được định nghĩa đủ 3 loại rules:
        1.  *Presence*: Trường đó là bắt buộc (`required`), tùy chọn (`nullable`) hoặc thỉnh thoảng xuất hiện (`sometimes`).
        2.  *Type*: Kiểu dữ liệu chính xác (`string`, `integer`, `boolean`, `array`, `email`).
        3.  *Boundary*: Giới hạn kích thước/phạm vi (`min`, `max`, `in:cases`, `regex`, foreign key `exists`).
    *   *Soft-Delete Awareness*: Khi validate khóa ngoại (`exists`), bắt buộc phải loại trừ các bản ghi đã bị xóa mềm (`whereNull('deleted_at')`).
4.  **Controller (`app/Http/Controllers/`)**:
    *   **Quy tắc "Siêu mỏng" (Thin Controller)**: Controller chỉ đóng vai trò làm bộ điều phối (orchestrator).
    *   **Tuyệt đối không chứa logic nghiệp vụ**, không chứa câu lệnh Eloquent Query (như `User::create(...)` hoặc `where(...)`), không tự validate dữ liệu.
    *   **Nhiệm vụ**: Trích xuất dữ liệu sạch từ FormRequest ➔ Gọi Service thông qua `ApiFactory` ➔ Nhận dữ liệu đầu ra ➔ Đóng gói vào JsonResource và trả về thành công/thất bại qua các helper phương thức như `sendSuccessResponse()`.
5.  **DTO - Data Transfer Object (`app/DTOs/`)**:
    *   Là các lớp `final readonly` dùng để truyền dữ liệu định kiểu mạnh mẽ giữa Controller và Service.
    *   Giúp loại bỏ hoàn toàn việc truyền các mảng hỗn hợp không định kiểu (`array $data`) vào Service - nguyên nhân hàng đầu gây ra lỗi runtime và khó debug.
    *   Bắt buộc có một phương thức khởi tạo tĩnh `public static function from(array $data): self` để tự động map dữ liệu từ Request.
6.  **Service Layer (`app/Services/`)**:
    *   **Quy tắc "Dày Service" (Rich Business Logic)**: Nơi chứa 100% logic nghiệp vụ của ứng dụng.
    *   Kế thừa từ lớp cơ sở `App\Services\Base\Service` có tích hợp sẵn cơ chế phân cấp ngữ cảnh người dùng (`withUser()`).
    *   *Transactions*: Bắt buộc sử dụng Manual Transactions (`DB::beginTransaction()`, `DB::commit()`, `DB::rollBack()`) cho tất cả các thao tác ghi (mutations) tác động từ 2 bảng database trở lên.
    *   *Ghi log*: Mọi hành động làm thay đổi dữ liệu hệ thống (Create, Update, Delete) bắt buộc phải ghi lại hành trình bằng lệnh `Log::info()` kèm theo ID tài nguyên bị ảnh hưởng.
    *   *No Cross-Calling*: Các service ngang hàng không được gọi trực tiếp lẫn nhau để tránh tạo liên kết chéo phức tạp (circular dependencies).
7.  **JsonResource / Collection (`app/Http/Resources/`)**:
    *   Định dạng dữ liệu trả về cho Frontend, đảm bảo cấu trúc JSON đồng bộ, không bị lộ các trường nhạy cảm (password, secret token).
    *   Sử dụng `DateHelper` hoặc `FileHelper` để định dạng thống nhất ngày tháng và đường dẫn tệp tin.
    *   Sử dụng `whenLoaded()` để ngăn chặn lỗi N+1 Query khi trả về các quan hệ (relationships).

---

## 2. ⚙️ Cấu Trúc Thư Mục Backend

Mã nguồn Backend được tổ chức khoa học trong thư mục `backend/app/`:

```text
backend/app/
├── Console/Commands/  # Lệnh Artisan (VD: php artisan code:format)
├── DTOs/              # Lớp đóng gói dữ liệu đầu vào cho Service
├── Enums/             # Enums định nghĩa trạng thái, loại (UserStatus...)
├── Exceptions/        # Exception tùy biến (InputException, NotFoundException)
├── Factories/         # Các Factory khởi tạo Service (ApiFactory, CommonFactory)
├── Helpers/           # Các hàm tiện ích dùng chung (ResponseHelper)
├── Http/              # Lớp giao tiếp HTTP
│   ├── Controllers/   # Controller mỏng điều hướng
│   ├── Middleware/    # Lớp lọc request
│   ├── Requests/      # Lớp validation dữ liệu đầu vào (FormRequest)
│   └── Resources/     # Lớp định dạng dữ liệu đầu ra (JSON Resource)
├── Models/            # Lớp thực thể Eloquent Models & Query Scopes
├── Providers/         # Service Providers cấu hình hệ thống
├── Rules/             # Quy tắc validate tự viết riêng
└── Services/          # Trái tim logic nghiệp vụ của dự án
```

---

## 3. 🚀 Quy Trình 11 Bước Viết Backend API Hoàn Chỉnh

Khi triển khai bất kỳ tính năng Backend mới nào, bạn hoặc AI Agent bắt buộc phải tuân theo quy trình 11 bước chuẩn dưới đây:

### Bước 1: Thiết Lập Hạ Tầng Cơ Sở Dữ Liệu (Database Setup)
1.  **Migration**: Tạo bảng, thiết lập kiểu cột tối ưu, các chỉ mục (indexes), khóa ngoại và chế độ xóa mềm (`softDeletes()`).
2.  **Model**: Tạo Model, khai báo các trường được phép điền `$fillable`, khai báo ép kiểu `$casts` (VD: status sang Enum), và định nghĩa các **Query Scopes** để tái sử dụng câu lệnh query.
3.  **Enums**: Tạo các Enum đại diện cho trạng thái, loại dữ liệu. Enum bắt buộc có method `label()` trả về chuỗi đa ngôn ngữ thông qua hàm `trans()`.

### Bước 2: Dựng Table Service (Nếu Là Endpoint Danh Sách)
*   Nếu API yêu cầu hiển thị danh sách có phân trang, tìm kiếm, lọc và sắp xếp, hãy tạo một `TableService` kế thừa từ `App\Services\Base\TableService`.
*   Định nghĩa phương thức `makeNewQuery()` và khai báo các mảng cấu hình lọc `$searchables`, `$filterables`, `$orderables`.

### Bước 3: Tạo Lớp Validation (FormRequest)
*   Tạo lớp FormRequest trong thư mục `app/Http/Requests/Api/{Module}/`.
*   Áp dụng đầy đủ **Quy tắc validation 3 lớp**.
*   Đảm bảo bản dịch thuộc tính trực quan trong phương thức `attributes()`.

### Bước 4: Định Nghĩa DTO (Data Transfer Object)
*   Tạo một lớp `final readonly` DTO kế thừa cấu trúc chuẩn trong `app/DTOs/Api/{Module}/{Action}Data.php`.
*   Khai báo các thuộc tính tường minh và viết phương thức khởi tạo tĩnh `from(array $data)`.

### Bước 5: Viết Service Layer & Business Logic
*   Tạo Service trong `app/Services/Api/{Module}Service.php`.
*   Triển khai các phương thức nghiệp vụ nhận tham số đầu vào là lớp DTO vừa tạo.
*   Sử dụng Transactions nếu thực hiện nhiều truy vấn ghi. Ghi log các đột biến dữ liệu.
*   *Tách tác vụ*: Nếu logic tốn nhiều thời gian xử lý (gửi email, xử lý ảnh lớn), chuyển giao sang Background Job.

### Bước 5a: Viết Unit Test Cho Service (Nếu Cần)
*   Nếu Service có chứa các lệnh gọi API bên thứ ba, tích hợp SSO hoặc chứa luồng rẽ nhánh phức tạp (> 3 nhánh rẽ `if/else`), bắt buộc phải viết **Unit Test** ngay lập tức để cô lập và kiểm tra độc lập phương thức đó trước khi tiến lên lớp Controller.
*   **Đường dẫn chuẩn**: `backend/tests/Unit/Services/{Module}ServiceTest.php`
*   **Ví dụ**: `backend/tests/Unit/Services/AuthServiceTest.php`

### Bước 6: Đăng Ký Service Vào Factory
*   Đăng ký Service mới vào lớp `ApiFactory` (`app/Factories/ApiFactory.php`) để Controller có thể resolve dễ dàng.
*   Đối với `TableService`, đăng ký dạng Transient binding trong `AppServiceProvider`.

### Bước 7: Viết Controller & Cấu Hình Routes
*   Tạo Controller siêu mỏng, kế thừa từ guard base thích hợp.
*   Khai báo API endpoint trong `routes/api.php`, liên kết tới Controller mới tạo và áp dụng Middleware tương ứng.

### Bước 7a: Viết Feature Test Cho Endpoint (BẮT BUỘC)
Trước khi định dạng dữ liệu đầu ra, hãy viết **Feature Test** bằng PHPUnit để kiểm tra toàn bộ vòng đời API:
*   **Đường dẫn chuẩn**: `backend/tests/Feature/Api/{Module}/{Resource}{Action}Test.php`
*   **Ví dụ**: `backend/tests/Feature/Api/Company/CompanyStoreTest.php`

Các kịch bản bắt buộc phải có:
1.  *Happy path*: Request hợp lệ trả về dữ liệu đúng chuẩn, mã 200 hoặc 201.
2.  *Unauthenticated*: Không truyền token hoặc truyền sai token trả về 401.
3.  *Forbidden*: Tài khoản không có đủ quyền truy cập trả về 403.
4.  *Validation Error*: Truyền thiếu hoặc sai dữ liệu validation trả về 422 kèm chi tiết lỗi từng trường.
5.  *Not Found*: Truyền sai ID tài nguyên trả về 404.

> [!IMPORTANT]
> Sau khi chạy test, bắt buộc phải tạo hoặc cập nhật báo cáo kết quả tại `docs/testing/{feature-name}.md`. Báo cáo phải ghi nhận cả các lần test thất bại và cách khắc phục (không chỉ ghi `pass` khi đã sửa xong).

### Bước 8: Định Dạng Dữ Liệu Trả Về (JsonResource)
*   Tạo `JsonResource` và `ResourceCollection` tương ứng trong `app/Http/Resources/Api/{Module}/`.
*   Ép kiểu rõ ràng các giá trị đầu ra, định dạng ngày tháng qua `DateHelper` và bảo vệ các quan hệ bằng `whenLoaded()`.

### Bước 9: Đồng Bộ Hóa Tài Liệu (Documentation)
*   Cập nhật annotations Scramble trong Controller để hệ thống tự động sinh tài liệu chuẩn.
*   Tạo hoặc cập nhật tài liệu nghiệp vụ thủ công trong `docs/logic/{module}/{feature}.md`.
*   Nếu có thêm luật nghiệp vụ mới, ghi danh vào `docs/system/br-registry.md`.
*   Chạy lệnh `php artisan scramble:export` để đồng bộ hóa file đặc tả API.

### Bước 10: Định Dạng Code & Audit Chất Lượng Cuối Cùng
*   Chạy lệnh `php artisan code:format` để Pint tự động tối ưu hóa cú pháp PHP.
*   Chạy script validate tự động để kiểm tra tuân thủ cấu trúc thư mục:
    `php .agents/scripts/validate-backend.php backend/app/Modules/{ModuleName}`.
*   Đảm bảo toàn bộ Feature & Unit Tests của module đó chạy qua 100% thành công.

### Bước 11: Hoàn Thành Nhiệm Vụ
*   Mở file task tương ứng trong `docs/tasks/`, đánh dấu hoàn thành tất cả các checklist và cập nhật trạng thái frontmatter của task thành `status: completed`.
