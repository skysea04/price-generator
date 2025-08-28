import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QuotationData } from '../types';

interface QuotationModalProps {
  data: QuotationData;
  logo: string;
  isPreview: boolean;
  onClose: () => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  data,
  logo,
  isPreview,
  onClose
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async () => {
    setIsExporting(true);
    const element = document.getElementById('quotation-content');
    if (element) {
      try {
        const canvas = await html2canvas(element);
        const img = new Image();
        img.src = canvas.toDataURL('image/jpeg');

        const link = document.createElement('a');
        link.href = img.src;

        const dateString = data.startDate || new Date().toISOString().split('T')[0];
        const fileName = data.quotationName
          ? `${data.quotationName}_${dateString}.jpg`
          : `${new Date().toLocaleDateString('zh-TW')}_quotation.jpg`;
        link.download = fileName;
        link.click();
      } catch (error) {
        console.error('Export image failed:', error);
      }
    }
    setIsExporting(false);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    const element = document.getElementById('quotation-content');
    if (element) {
      try {
        const canvas = await html2canvas(element);
        const imgWidth = 208;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);

        const dateString = data.startDate || new Date().toISOString().split('T')[0];
        const fileName = data.quotationName
          ? `${data.quotationName}_${dateString}.pdf`
          : `${new Date().toLocaleDateString('zh-TW')}_quotation.pdf`;
        pdf.save(fileName);
      } catch (error) {
        console.error('Export PDF failed:', error);
      }
    }
    setIsExporting(false);
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div id="quotation-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                {logo && (
                  <img
                    src={logo}
                    alt={data.company}
                    style={{ marginRight: '8px', height: '40px' }}
                  />
                )}
                <div>
                  <h4 className="modal-title fs-2 fw-bold">{data.company} - 報價單</h4>
                  {data.customerTaxID && (
                    <span>統一編號：{data.customerTaxID}</span>
                  )}
                </div>
              </div>
              {!isExporting && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                ></button>
              )}
            </div>

            <div className="modal-body">
              <dl className="row">
                <dt className="col-3">報價公司/人員：</dt>
                <dd className="col-9">{data.quoterName}</dd>
                {data.quoterTaxID && (
                  <>
                    <dt className="col-3">統一編號：</dt>
                    <dd className="col-9">{data.quoterTaxID}</dd>
                  </>
                )}
                {data.tel && (
                  <>
                    <dt className="col-3">聯絡電話：</dt>
                    <dd className="col-9">{data.tel}</dd>
                  </>
                )}
                <dt className="col-3">E-Mail：</dt>
                <dd className="col-9">{data.email}</dd>
                {data.startDate && (
                  <>
                    <dt className="col-3">報價日期：</dt>
                    <dd className="col-9">{data.startDate}</dd>
                  </>
                )}
                {data.endDate && (
                  <>
                    <dt className="col-3">有效日期：</dt>
                    <dd className="col-9">{data.endDate}</dd>
                  </>
                )}
              </dl>

              <div className="card">
                <div className="table-responsive">
                  <table className="table table-vcenter">
                    <thead>
                      <tr>
                        <th>類別</th>
                        <th>項目</th>
                        <th>內容</th>
                        <th>單價</th>
                        <th>數量</th>
                        <th className="text-end">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // 按類別分組
                        const groupedItems = data.serviceItems.reduce((groups, item) => {
                          const category = item.category || '未分類';
                          if (!groups[category]) {
                            groups[category] = [];
                          }
                          groups[category].push(item);
                          return groups;
                        }, {} as Record<string, typeof data.serviceItems>);

                        const rows: React.JSX.Element[] = [];
                        let globalIndex = 0;

                        Object.entries(groupedItems).forEach(([category, items]) => {
                          items.forEach((item, itemIndex) => {
                            rows.push(
                              <tr key={globalIndex}>
                                {itemIndex === 0 && (
                                  <td
                                    rowSpan={items.length}
                                    className="align-middle fw-bold"
                                    style={{
                                      backgroundColor: '#f8f9fa',
                                      borderRight: '2px solid #dee2e6',
                                      verticalAlign: 'middle'
                                    }}
                                  >
                                    {category}
                                  </td>
                                )}
                                <td>{item.item}</td>
                                <td>{item.content}</td>
                                <td>{item.price}</td>
                                <td>
                                  {item.count}
                                  {item.unit && `/${item.unit}`}
                                </td>
                                <td className="text-end">NT$ {item.amount}</td>
                              </tr>
                            );
                            globalIndex++;
                          });
                        });

                        return rows;
                      })()}
                      <tr>
                        <td colSpan={6} className="text-end">
                          <div className="d-flex flex-column align-items-end">
                            <div className="mb-1">
                              <span>未稅：NT$ </span>
                              <span className="fs-5 fw-bold text-danger" style={{ minWidth: '100px', display: 'inline-block', textAlign: 'right' }}>
                                {data.excludingTax}
                              </span>
                              <span> 元</span>
                            </div>
                            {data.tax !== 0 && (
                              <>
                                <div className="mb-1">
                                  <span>{data.taxName}稅 {data.percentage}%：</span>
                                  <span className="fs-5 fw-bold text-danger" style={{ minWidth: '100px', display: 'inline-block', textAlign: 'right' }}>
                                    {data.tax}
                                  </span>
                                  <span> 元</span>
                                </div>
                                <div>
                                  <span>含稅：NT$ </span>
                                  <span className="fs-5 fw-bold text-danger" style={{ minWidth: '100px', display: 'inline-block', textAlign: 'right' }}>
                                    {data.includingTax}
                                  </span>
                                  <span> 元</span>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {data.desc && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>備註</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ whiteSpace: 'pre-line' }}>{data.desc}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {data.isSign && (
                <div className="card mt-4" style={{ height: '120px' }}>
                  <div className="card-body">
                    <h3 className="card-title">客戶簽章</h3>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isPreview && (
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportImage}
                disabled={isExporting}
              >
                {isExporting ? '匯出中...' : '匯出圖片'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportPdf}
                disabled={isExporting}
              >
                {isExporting ? '匯出中...' : '下載為 PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;