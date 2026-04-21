const ExcelJS = require('exceljs');

async function createExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Báo Giá Website', {
        properties: { tabColor: { argb: 'FFF59E0B' } }
    });

    // Styles
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: {style:'thin', color: {argb:'FF94A3B8'}},
            left: {style:'thin', color: {argb:'FF94A3B8'}},
            bottom: {style:'thin', color: {argb:'FF94A3B8'}},
            right: {style:'thin', color: {argb:'FF94A3B8'}}
        }
    };

    const cellStyle = {
        alignment: { vertical: 'middle', wrapText: true },
        font: { size: 11 },
        border: {
            top: {style:'thin', color: {argb:'FFE2E8F0'}},
            left: {style:'thin', color: {argb:'FFE2E8F0'}},
            bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
            right: {style:'thin', color: {argb:'FFE2E8F0'}}
        }
    };
    
    // Widths
    sheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'HẠNG MỤC TÍNH NĂNG', key: 'title', width: 35 },
        { header: 'MÔ TẢ CHI TIẾT', key: 'features', width: 60 },
        { header: 'THÀNH TIỀN (VNĐ)', key: 'price', width: 22 }
    ];

    // Title & info
    sheet.insertRow(1, ['CÔNG TY TNHH DOMATION VIỆT NAM']);
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFB45309' } };
    sheet.mergeCells('A1:D1');
    
    sheet.insertRow(2, ['BẢNG BÁO GIÁ DỊCH VỤ THIẾT KẾ WEBSITE (GÓI TIÊU CHUẨN)']);
    sheet.getCell('A2').font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.mergeCells('A2:D2');

    sheet.insertRow(3, []);

    // Header Row
    const headerRow = sheet.getRow(4);
    headerRow.values = ['STT', 'HẠNG MỤC TÍNH NĂNG', 'MÔ TẢ CHI TIẾT', 'THÀNH TIỀN (VNĐ)'];
    headerRow.eachCell(cell => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });
    headerRow.height = 30;

    const data = [
        {
            title: "Thiết kế Giao diện (UI/UX)",
            price: 2500000,
            features: "• Thiết kế độc quyền theo nhận diện thương hiệu.\n• Giao diện chuẩn Responsive (tương thích Mobile, PC, Tablet).\n• Hiệu ứng hình ảnh, animation mượt mà, chuyên nghiệp."
        },
        {
            title: "Module Trang chủ",
            price: 1500000,
            features: "• Slider banner tràn viền tự động chuyển động.\n• Khối sản phẩm nổi bật/bán chạy chia theo đối tượng.\n• Khối tóm tắt: Về chúng tôi, Tin tức, Đối tác, Chứng nhận."
        },
        {
            title: "Module Giới thiệu",
            price: 1000000,
            features: "• Trang lịch sử hình thành, tầm nhìn, sứ mệnh.\n• Hồ sơ năng lực, đội ngũ chuyên gia, hệ thống nhà máy/chứng nhận."
        },
        {
            title: "Module Sản phẩm (Cốt lõi)",
            price: 2500000,
            features: "• Phân loại danh mục (Theo dòng sữa, độ tuổi, công dụng).\n• Trang chi tiết: Ảnh zoom sắc nét, giá, bảng thành phần dinh dưỡng, công dụng, đối tượng.\n• Thuật toán gợi ý 'Sản phẩm liên quan'."
        },
        {
            title: "Module Hệ thống Điểm bán",
            price: 1500000,
            features: "• Danh sách đại lý, hệ thống phân phối toàn quốc.\n• Bộ lọc tìm kiếm thông minh theo Tỉnh/Thành phố, Quận/Huyện."
        },
        {
            title: "Module Cẩm nang & Tuyển dụng",
            price: 1000000,
            features: "• Trang Tin tức / Kiến thức dinh dưỡng chuẩn báo chí.\n• Trang Tuyển dụng: Đăng vị trí, form nộp CV trực tuyến."
        },
        {
            title: "Module Tương tác & Chuyển đổi",
            price: 500000,
            features: "• Nút liên hệ nhanh (Hotline, Zalo, Messenger Facebook).\n• Form 'Nhận tư vấn/Đặt hàng' gửi thẳng thông tin về Email.\n• Tích hợp Google Maps chỉ đường."
        },
        {
            title: "Hệ thống Quản trị & Tối ưu SEO",
            price: 1500000,
            features: "• Cấu trúc web chuẩn SEO On-page, tối ưu tốc độ load (<3s).\n• Tích hợp chứng chỉ bảo mật SSL (https).\n• Trang Admin quản trị tiếng Việt, dễ dàng tự thêm/sửa/xóa nội dung."
        },
        {
            title: "Tên miền quốc tế/VN (.com/.vn)",
            price: 0,
            features: "Tặng miễn phí năm đầu tiên"
        },
        {
            title: "Hosting Tốc độ cao",
            price: 0,
            features: "Tặng miễn phí năm đầu tiên"
        }
    ];

    let rowIndex = 5;
    let total = 0;
    data.forEach((item, index) => {
        const row = sheet.getRow(rowIndex);
        row.values = [index + 1, item.title, item.features, item.price];
        row.getCell(4).numFmt = '#,##0 "₫"';
        
        row.eachCell(cell => {
            cell.font = cellStyle.font;
            cell.border = cellStyle.border;
            cell.alignment = cellStyle.alignment;
            if (cell.col === 1) cell.alignment = { ...cellStyle.alignment, horizontal: 'center' };
        });
        
        row.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
        row.getCell(4).font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
        
        const lines = item.features.split('\n').length;
        row.height = Math.max(30, lines * 18);
        
        total += item.price;
        rowIndex++;
    });

    const totalRow = sheet.getRow(rowIndex);
    totalRow.values = ['', 'TỔNG CỘNG (CHƯA VAT)', '', total];
    totalRow.getCell(2).font = { bold: true, size: 13, color: { argb: 'FFDC2626' } };
    totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(4).numFmt = '#,##0 "₫"';
    totalRow.getCell(4).font = { bold: true, size: 13, color: { argb: 'FFDC2626' } };
    totalRow.height = 40;
    totalRow.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.border = cellStyle.border;
        if(colNum===4) cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    sheet.mergeCells('B' + rowIndex + ':C' + rowIndex);
    
    rowIndex += 2;
    sheet.getCell('B' + rowIndex).value = "* Ghi chú:";
    sheet.getCell('B' + rowIndex).font = { bold: true, italic: true };
    rowIndex++;
    sheet.getCell('B' + rowIndex).value = "- Báo giá trên là gói Tiêu chuẩn (Minimum Option), chưa bao gồm các Add-on (Bán hàng, Thanh toán, Quản lý thành viên).";
    rowIndex++;
    sheet.getCell('B' + rowIndex).value = "- Năm thứ 2 trở đi: Phí duy trì Tên miền & Hosting là 1.210.000 ₫/năm.";
    rowIndex++;
    sheet.getCell('B' + rowIndex).value = "- Thời gian thực hiện dự kiến: 10 - 15 ngày làm việc.";

    await workbook.xlsx.writeFile('Bao_Gia_Website_DOMATION_TieuChuan.xlsx');
    console.log("Done");
}

createExcel().catch(console.error);
