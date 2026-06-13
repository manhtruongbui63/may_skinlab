---
name: bks-brand-guidelines
description: >
  Áp dụng BKS brand identity — màu sắc, typography, tone of voice, và messaging guidelines —
  vào bất kỳ artifact nào: tài liệu, email, landing page, báo cáo, slide, hay nội dung marketing.
  Kích hoạt skill này khi người dùng muốn: tạo content đúng brand BKS, kiểm tra xem nội dung/thiết kế
  có đúng brand không, viết theo giọng văn BKS, tạo email/landing page/tài liệu mang màu sắc BKS,
  hoặc hỏi "viết theo tone BKS", "đúng brand chưa", "màu BKS là gì", "font BKS dùng gì".
  KHÔNG dùng cho việc refactor code component (dùng bks-design) hoặc chỉ apply theme nhanh vào slide (dùng bks-theme-factory).
---

# BKS Brand Guidelines

Skill này giúp tạo ra nội dung và artifact đúng chuẩn BKS brand identity — từ visual đến tone of voice.

> **Phân biệt với các skill khác:**
> - `fe-implementation` → implement design system vào code (Next.js, Tailwind, shadcn)
> - **`bks-brand-guidelines`** (skill này) → toàn diện: tạo content mới đúng brand, review brand compliance, onboard về BKS identity
>
> **Output mong đợi khi dùng skill này:** Copy text, email template, landing page HTML, báo cáo markdown, hoặc checklist brand review — tuỳ theo yêu cầu của user.

---

## Brand Colors

### Màu chính

| Tên | Hex | Dùng cho |
|---|---|---|
| **Brand Teal** | `#03be86` | CTA chính, accent, link, highlight |
| **BKS Black** | `#201515` | Text chính, heading, nền tối |
| **Cream White** | `#fffefb` | Nền trang, card, background sáng |

### Màu phụ trợ

| Tên | Hex | Dùng cho |
|---|---|---|
| **Light Sand** | `#eceae3` | Ghost button, muted surface, section nền |
| **Sand Border** | `#c5c0b1` | Border thường, divider |
| **Dark Charcoal** | `#36342e` | Divider mạnh, footer, border nổi bật |
| **Warm Gray** | `#939084` | Text phụ, placeholder, caption |
| **Brand Hover** | `#02a373` | Hover state của Teal |

### Quy tắc màu sắc

- **Teal (#03be86) là màu nhận diện** — dùng có chủ đích, không spam toàn bộ trang
- Nền sáng: dùng Cream White + text BKS Black
- Nền tối: dùng BKS Black + text Cream White
- Accent: Teal dùng cho 1–2 điểm nhấn mỗi section
- **Tránh**: màu bão hòa cao (đỏ, xanh dương đậm, tím), gradient phức tạp

---

## Typography

### Font chính

| Font | Dùng cho | CSS class |
|---|---|---|
| **Bricolage Grotesque** | Display, heading lớn, hero | `font-display` |
| **Inter** | Body text, UI, button | `font-sans` |
| **Playfair Display** | Editorial, quote, accent text | `font-serif` |

### Scale chữ

| Vị trí | Size | Font |
|---|---|---|
| Hero headline | 64px | Bricolage Grotesque |
| Page title | 40px | Bricolage Grotesque |
| Section heading | 36px | Bricolage Grotesque |
| Card title | 24px | Bricolage / Inter |
| Body thường | 16px | Inter |
| Body intro | 18px | Inter |
| Caption / meta | 12–14px | Inter |
| Editorial / quote | 32–40px | Playfair Display |

### Quy tắc typography

- Heading: **Bricolage Grotesque**, weight 600–700, letter-spacing thường hoặc tight
- Body: **Inter**, weight 400–500, line-height 1.6–1.7
- Quote/editorial: **Playfair Display**, italic, kết hợp với Teal accent
- **Tránh**: font quá nhiều weight khác nhau trong cùng trang, ALL CAPS cho paragraph

---

## Tone of Voice

BKS giao tiếp như một **đối tác đáng tin cậy** — chuyên nghiệp nhưng không cứng nhắc, hiện đại nhưng không khoa trương.

### 4 thuộc tính giọng văn

**1. Rõ ràng — Clear**
Nói thẳng vào vấn đề. Không vòng vo. Dùng câu ngắn khi có thể.

> ✅ "BKS giúp bạn ký hợp đồng trong 5 phút."
> ❌ "Với nền tảng công nghệ tiên tiến, BKS mang đến giải pháp toàn diện giúp tối ưu hóa quy trình ký kết hợp đồng của doanh nghiệp bạn."

**2. Tự tin — Confident**
Không xin lỗi, không "có thể", không "có lẽ". Phát biểu như người hiểu rõ sản phẩm.

> ✅ "Dữ liệu của bạn được mã hóa đầu cuối."
> ❌ "Chúng tôi cố gắng bảo vệ dữ liệu của bạn theo các tiêu chuẩn bảo mật hiện hành."

**3. Thân thiện — Warm**
Con người, không robot. Dùng "bạn" và "chúng tôi". Tránh văn phong hành chính.

> ✅ "Bắt đầu ngay — không cần thẻ tín dụng."
> ❌ "Người dùng có thể khởi tạo tài khoản mà không cần cung cấp thông tin thanh toán."

**4. Thực dụng — Practical**
Luôn gắn với lợi ích thực tế. "Để làm gì" quan trọng hơn "là gì".

> ✅ "Ký hợp đồng từ điện thoại — khách hàng không cần cài app."
> ❌ "BKS hỗ trợ e-signature trên mobile platform với cross-platform compatibility."

---

## Messaging Framework

### Positioning

- **Positioning**: BKS là nền tảng quản lý hợp đồng và tự động hóa quy trình cho doanh nghiệp Việt Nam
- **Differentiator**: Đơn giản như dùng app cá nhân, mạnh mẽ như phần mềm enterprise

### Value propositions theo audience

**Decision maker (C-level, owner):**
> Giảm rủi ro pháp lý, kiểm soát toàn bộ vòng đời hợp đồng, tiết kiệm chi phí vận hành.

**End user (nhân viên, legal, sales):**
> Ký hợp đồng trong 5 phút. Tìm lại bất kỳ điều khoản nào trong vài giây. Không còn email qua lại.

**IT / Tech:**
> API đầy đủ, SSO, audit log, on-premise option. Tích hợp với hệ thống hiện tại.

---

## Do's and Don'ts

### ✅ Do

- Dùng Teal làm điểm nhấn chính, phối với Cream White hoặc BKS Black
- Viết ngắn — headline dưới 10 từ, CTA dưới 5 từ
- Ưu tiên benefit, không phải feature: "Ký nhanh hơn" thay vì "Có tính năng e-signature"
- Dùng số cụ thể khi có thể: "5 phút", "3 bước", "98% uptime"
- Giữ whitespace rộng rãi — BKS design thở thoáng

### ❌ Don't

- Không dùng gradient phức tạp hoặc màu bão hòa cao (đỏ, tím, xanh dương đậm)
- Không dùng jargon kỹ thuật với người dùng cuối
- Không ALL CAPS trong body text
- Không dùng shadow đổ nặng — BKS dùng border thay shadow
- Không quá nhiều CTA trong cùng một section
- Không font-weight quá nhiều loại (tối đa 2–3 weight / trang)

---

## Áp dụng brand vào các loại artifact

### Email / Thông báo nội bộ
- Mở đầu thẳng vào vấn đề — không "Kính gửi", không "Theo như đã trao đổi"
- Dùng bullet nếu có từ 3 điểm trở lên
- CTA rõ ràng ở cuối: "Xem chi tiết tại đây" hoặc "Reply email này để xác nhận"
- Ký bằng tên, không "BKS Team" nếu có thể

### Landing page / HTML
- Hero: Bricolage Grotesque 64px + subtext Inter 18px + Teal CTA
- Background: Cream White (`#fffefb`)
- Section phân cách bằng Light Sand (`#eceae3`) không phải border
- Teal chỉ dùng cho: CTA button, link, icon accent, số highlight

### Báo cáo / Tài liệu
- Cover: BKS Black nền + Cream White text + Teal accent line
- Body: Cream White nền + BKS Black text + heading Bricolage
- Dùng table thay bullet khi có dữ liệu dạng so sánh
- Page number + logo ở footer

### Slide / Presentation
- Áp dụng BKS color palette và typography theo hướng dẫn ở trên
- Giới hạn 1 ý chính / slide — không nhồi nhét
- Số liệu: to, Teal, Bricolage Grotesque

---

## Quick Checklist — Brand Review

Dùng khi review một artifact có đúng brand BKS không:

```
□ Màu sắc có trong BKS palette không? (Teal, Black, Cream, Sand)
□ Font có đúng không? (Bricolage / Inter / Playfair)
□ Tone có rõ ràng, tự tin, thân thiện không?
□ Không có jargon kỹ thuật với người dùng cuối?
□ CTA có ngắn gọn và action-oriented không?
□ Whitespace có đủ thoáng không?
□ Số liệu cụ thể thay vì nói chung chung?
□ Không quá nhiều màu / font weight / CTA?
```
