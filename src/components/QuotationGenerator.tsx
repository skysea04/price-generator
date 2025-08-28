import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { QuotationData, ServiceItem } from '../types';
import ServiceItemForm from './ServiceItemForm';
import QuotationModal from './QuotationModal';

const QuotationGenerator: React.FC = () => {
  const [formData, setFormData] = useState<QuotationData>({
    quotationName: '',
    company: '',
    quoterName: '',
    email: '',
    serviceItems: [
      { category: '', item: '', content: '', price: 0, count: 1, unit: '', amount: 0 }
    ],
    excludingTax: 0,
    percentage: 5,
    tax: 0,
    includingTax: 0,
    isSign: true
  });

  const [logoFile, setLogoFile] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [historyData, setHistoryData] = useState<QuotationData[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const [pasteMode, setPasteMode] = useState<'replace' | 'append'>('replace');
  const [pasteText, setPasteText] = useState<string>('');
  const [showPasteSection, setShowPasteSection] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const saved = localStorage.getItem('quotation');
    if (saved) {
      setHistoryData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const total = formData.serviceItems.reduce((acc, item) => acc + item.amount, 0);
    const tax = Math.ceil((formData.percentage / 100) * total);
    setFormData(prev => ({
      ...prev,
      excludingTax: total,
      tax,
      includingTax: total + tax
    }));
  }, [formData.serviceItems, formData.percentage]);

  const handleInputChange = (field: keyof QuotationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Email 驗證
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError('請輸入正確的電子信箱格式');
      } else {
        setEmailError('');
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(URL.createObjectURL(file));
    }
  };

  const handleServiceItemChange = (index: number, item: ServiceItem) => {
    const newItems = [...formData.serviceItems];
    newItems[index] = item;
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const addServiceItem = () => {
    setFormData(prev => ({
      ...prev,
      serviceItems: [
        ...prev.serviceItems,
        { category: '', item: '', content: '', price: 0, count: 1, unit: '', amount: 0 }
      ]
    }));
  };

  const removeServiceItem = (index: number) => {
    if (formData.serviceItems.length > 1) {
      const newItems = formData.serviceItems.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, serviceItems: newItems }));
    }
  };

  const handleHistoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    if (!isNaN(index) && historyData[index]) {
      setFormData(historyData[index]);
    }
  };

  const saveToHistory = (data: QuotationData) => {
    const dataWithTimestamp = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const newHistory = [dataWithTimestamp, ...historyData.slice(0, 4)];
    setHistoryData(newHistory);
    localStorage.setItem('quotation', JSON.stringify(newHistory));
  };

  const handleSubmit = () => {
    saveToHistory(formData);
    setIsPreview(false);
    setShowModal(true);
  };


  const handleExportAllData = () => {
    const exportData = {
      currentData: formData,
      historyData: historyData,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);

    // 使用與 PDF 匯出相同的命名邏輯
    const dateString = formData.startDate || new Date().toISOString().split('T')[0];
    const fileName = formData.quotationName
      ? `${formData.quotationName}_完整資料_${dateString}.json`
      : `${new Date().toLocaleDateString('zh-TW')}_quotation_完整資料.json`;

    link.download = fileName;
    link.click();
  };

  const handleExportCurrentData = () => {
    const exportData = {
      currentData: formData,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);

    // 使用與 PDF 匯出相同的命名邏輯
    const dateString = formData.startDate || new Date().toISOString().split('T')[0];
    const fileName = formData.quotationName
      ? `${formData.quotationName}_${dateString}.json`
      : `${new Date().toLocaleDateString('zh-TW')}_quotation.json`;

    link.download = fileName;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        let importedCount = 0;

        // 檢查是否有當前報價單資料
        if (importedData.currentData) {
          setFormData(importedData.currentData);
          importedCount++;
        }

        // 檢查是否有歷史資料
        if (importedData.historyData && Array.isArray(importedData.historyData)) {
          // 合併歷史資料，避免重複
          const existingIds = new Set(historyData.map(item => JSON.stringify(item)));
          const newHistoryItems = importedData.historyData.filter(
            (item: any) => !existingIds.has(JSON.stringify(item))
          );

          if (newHistoryItems.length > 0) {
            const mergedHistory = [...newHistoryItems, ...historyData].slice(0, 5);
            setHistoryData(mergedHistory);
            localStorage.setItem('quotation', JSON.stringify(mergedHistory));
            importedCount += newHistoryItems.length;
          }
        }

        if (importedCount > 0) {
          alert(`資料匯入成功！匯入了 ${importedCount} 筆資料。`);
        } else {
          alert('未找到可匯入的資料，請檢查檔案格式。');
        }
      } catch (error) {
        alert('檔案格式錯誤，請選擇正確的 JSON 檔案');
      }
    };

    reader.readAsText(file);
    // 清空 input 值，讓同一個檔案可以重複選擇
    event.target.value = '';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.serviceItems.findIndex((_, index) => `item-${index}` === active.id);
      const newIndex = formData.serviceItems.findIndex((_, index) => `item-${index}` === over.id);

      const newServiceItems = arrayMove(formData.serviceItems, oldIndex, newIndex);
      setFormData(prev => ({ ...prev, serviceItems: newServiceItems }));
    }
  };

  const handlePasteText = (text: string) => {
    if (!text.trim()) {
      return;
    }

    const lines = text.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return;
    }

    // 解析數據
    const parsedItems: ServiceItem[] = [];
    let startIndex = 0;

    // 檢查第一行是否為標題行
    const firstLine = lines[0].split(/\s{2,}|\t/).map(cell => cell.trim());
    const isHeaderRow = firstLine.some(cell =>
      ['類別', '項目', '內容', '單價', '數量', '單位', '金額'].includes(cell)
    );

    if (isHeaderRow) {
      startIndex = 1;
    }

    // 解析數據行
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      // 嘗試多種分隔符：Tab、多個空格、單個空格
      let cells: string[] = [];

      // 優先使用 Tab 分隔
      if (line.includes('\t')) {
        cells = line.split('\t').map(cell => cell.trim());
      } else {
        // 使用正則表達式分割多個空格
        cells = line.split(/\s{2,}/).map(cell => cell.trim());

        // 如果分割後只有一個元素，嘗試用單個空格分割
        if (cells.length === 1 && line.includes(' ')) {
          cells = line.split(' ').map(cell => cell.trim()).filter(cell => cell);
        }
      }

      if (cells.length >= 5) { // 至少需要類別、項目、內容、單價、數量
        const category = cells[0] || '';
        const item = cells[1] || '';
        const content = cells[2] || '';
        const price = parseFloat(cells[3]) || 0;
        const count = parseInt(cells[4]) || 1;
        const unit = cells[5] || '';
        const amount = cells.length >= 7 ? parseFloat(cells[6]) || 0 : price * count;

        // 只添加有效的項目（至少要有類別和項目名稱）
        if (category && item) {
          parsedItems.push({
            category,
            item,
            content,
            price,
            count,
            unit,
            amount
          });
        }
      } else if (cells.length >= 4) { // 兼容舊格式：類別、項目、單價、數量
        const category = cells[0] || '';
        const item = cells[1] || '';
        const price = parseFloat(cells[2]) || 0;
        const count = parseInt(cells[3]) || 1;
        const unit = cells[4] || '';
        const amount = cells.length >= 6 ? parseFloat(cells[5]) || 0 : price * count;

        // 只添加有效的項目（至少要有類別和項目名稱）
        if (category && item) {
          parsedItems.push({
            category,
            item,
            content: '', // 舊格式沒有內容欄位，設為空字串
            price,
            count,
            unit,
            amount
          });
        }
      }
    }

    if (parsedItems.length > 0) {
      setFormData(prev => ({
        ...prev,
        serviceItems: pasteMode === 'replace' ? parsedItems : [...prev.serviceItems, ...parsedItems]
      }));
      // 靜默處理，不顯示彈窗
    }
    // 如果無法解析，也靜默處理，不顯示錯誤彈窗
  };


  const handleCopyToClipboard = async () => {
    try {
      const headers = ['類別', '項目', '內容', '單價', '數量', '單位', '金額'];
      const rows = [
        headers.join('\t'),
        ...formData.serviceItems.map(item =>
          [item.category, item.item, item.content, item.price, item.count, item.unit, item.amount].join('\t')
        )
      ];

      const text = rows.join('\n');
      await navigator.clipboard.writeText(text);
      alert('服務項目已複製到剪貼板！');
    } catch (error) {
      alert('複製失敗，請確認瀏覽器支援剪貼板功能');
    }
  };

  const isFormValid = formData.company && formData.quoterName && formData.email &&
    !emailError && formData.serviceItems.some(item => item.item && item.price > 0);

  return (
    <div className="container mt-4">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="h2">報價單產生器</h1>
          <div className="d-flex gap-2">
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleExportCurrentData}
              >
                匯出當前報價單
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleExportAllData}
              >
                匯出所有資料
              </button>
            </div>
            <label className="btn btn-outline-secondary btn-sm mb-0">
              匯入資料
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      <form>
        <div className="card mb-4">
          <div className="card-body">
            {historyData.length > 0 && (
              <div className="row mb-3">
                <div className="col-md-6 offset-md-6">
                  <label className="form-label">歷史報價單</label>
                  <select
                    className="form-select"
                    onChange={handleHistoryChange}
                    defaultValue=""
                  >
                    <option value="">選擇歷史報價單</option>
                    {historyData.map((data, index) => {
                      let displayName = '';

                      if (data.quotationName) {
                        if (data.createdAt) {
                          const createdDate = new Date(data.createdAt);
                          const dateTimeString = createdDate.toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          displayName = `${data.quotationName} (${dateTimeString})`;
                        } else {
                          displayName = data.quotationName;
                        }
                      } else {
                        displayName = `${data.startDate || '未設定日期'} - ${data.company}`;
                      }

                      return (
                        <option key={index} value={index}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            <h3 className="text-muted mb-3">主要資料</h3>

            <div className="mb-3">
              <label className="form-label">報價單名稱</label>
              <input
                type="text"
                className="form-control"
                value={formData.quotationName}
                onChange={(e) => handleInputChange('quotationName', e.target.value)}
                placeholder="請輸入報價單名稱（用於歷史記錄和檔案命名）"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">客戶 LOGO</label>
              <div className="d-flex gap-2">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {logoFile && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowLogoPreview(true)}
                    style={{
                      height: '52px',
                      minWidth: '70px',
                      fontSize: '14px',
                      padding: '0 12px'
                    }}
                  >
                    預覽
                  </button>
                )}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">客戶名稱 <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="請輸入客戶名稱"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">統一編號</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.customerTaxID || ''}
                  onChange={(e) => handleInputChange('customerTaxID', e.target.value)}
                  placeholder="請輸入統一編號"
                  pattern="[0-9]{8}"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">報價公司/人員 <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.quoterName}
                  onChange={(e) => handleInputChange('quoterName', e.target.value)}
                  placeholder="請輸入報價人員"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">統一編號</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.quoterTaxID || ''}
                  onChange={(e) => handleInputChange('quoterTaxID', e.target.value)}
                  placeholder="請輸入統一編號"
                  pattern="[0-9]{8}"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className={`form-control ${emailError ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="請輸入電子信箱"
                  required
                />
                {emailError && (
                  <div className="invalid-feedback">
                    {emailError}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">聯絡電話</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.tel || ''}
                  onChange={(e) => handleInputChange('tel', e.target.value)}
                  placeholder="請輸入聯絡電話"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">報價日期</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">有效日期</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="text-muted">服務項目</h3>
              <div className="d-flex gap-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowPasteSection(!showPasteSection)}
                  title="顯示或隱藏貼上欄位"
                  style={{ 
                    backgroundColor: '#17a2b8', 
                    borderColor: '#17a2b8', 
                    color: 'white',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#138496';
                    e.currentTarget.style.borderColor = '#117a8b';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#17a2b8';
                    e.currentTarget.style.borderColor = '#17a2b8';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  {showPasteSection ? '隱藏貼上欄位' : '顯示貼上欄位'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyToClipboard}
                  title="複製服務項目到剪貼板"
                  style={{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }}
                >
                  📄 複製項目（可貼至 Excel / Google Sheet）
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (window.confirm('確定要清空所有服務項目嗎？')) {
                      setFormData(prev => ({
                        ...prev,
                        serviceItems: [{ category: '', item: '', content: '', price: 0, count: 1, unit: '', amount: 0 }]
                      }));
                    }
                  }}
                  title="清空所有服務項目"
                  style={{ backgroundColor: '#6c757d', color: 'white', borderColor: '#6c757d' }}
                >
                  🗑️ 清空項目
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addServiceItem}
                >
                  新增項目
                </button>
              </div>
            </div>



            {showPasteSection && (
              <>
                <div className="alert alert-info mb-3">
                  <small>
                    <strong>📋 貼上項目使用說明：</strong><br />
                    • 直接在下方輸入框中貼上 Excel/Google Sheets 的數據<br />
                    • 支援多種格式：空格分隔、Tab 分隔、或混合分隔符<br />
                    • 第一行如果是標題行會自動跳過<br />
                    • 貼上後會自動計算金額並按順序排列<br />
                    • <strong>覆蓋模式：</strong>清空現有項目並貼上新項目<br />
                    • <strong>新增模式：</strong>保留現有項目並在後面新增貼上的項目
                  </small>
                </div>

                <div className="d-flex gap-3 align-items-center mb-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="pasteMode"
                      id="pasteModeReplace"
                      value="replace"
                      checked={pasteMode === 'replace'}
                      onChange={(e) => setPasteMode(e.target.value as 'replace' | 'append')}
                    />
                    <label className="form-check-label" htmlFor="pasteModeReplace">
                      覆蓋現有項目
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="pasteMode"
                      id="pasteModeAppend"
                      value="append"
                      checked={pasteMode === 'append'}
                      onChange={(e) => setPasteMode(e.target.value as 'replace' | 'append')}
                    />
                    <label className="form-check-label" htmlFor="pasteModeAppend">
                      新增到現有項目
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">📋</span>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="從 Excel 或 Google Sheets 複製數據並貼上到這裡，會自動根據當前選擇的貼上策略處理..."
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      onPaste={(e) => {
                        // 阻止默認的貼上行為
                        e.preventDefault();

                        // 獲取剪貼板中的純文本
                        const clipboardData = e.clipboardData;
                        const pastedText = clipboardData.getData('text');

                        // 直接處理貼上的文本
                        handlePasteText(pastedText);
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formData.serviceItems.map((_, index) => `item-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {formData.serviceItems.map((item, index) => (
                  <ServiceItemForm
                    key={`item-${index}`}
                    id={`item-${index}`}
                    item={item}
                    onChange={(newItem) => handleServiceItemChange(index, newItem)}
                    onRemove={() => removeServiceItem(index)}
                    canRemove={formData.serviceItems.length > 1}
                    showHeaders={index === 0}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <div className="text-end fs-5 mt-3">
              未稅價 合計：NT$ <span className="fw-bold text-danger">{formData.excludingTax}</span> 元整
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <h3 className="text-muted mb-3">稅率</h3>

            <div className="row g-3 mb-2">
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">稅別</label>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">稅率</label>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">金額</label>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="稅別"
                  value={formData.taxName || ''}
                  onChange={(e) => handleInputChange('taxName', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="稅率"
                    value={formData.percentage}
                    onChange={(e) => handleInputChange('percentage', parseFloat(e.target.value) || 0)}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="col-md-4">
                <input
                  type="number"
                  className="form-control"
                  placeholder="金額"
                  value={formData.tax}
                  readOnly
                />
              </div>
            </div>
            <div className="text-end fs-5 mt-3">
              含稅價 合計：NT$ <span className="fw-bold text-danger">{formData.includingTax}</span> 元整
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">備註</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.desc || ''}
                onChange={(e) => handleInputChange('desc', e.target.value)}
                placeholder="備註內容..."
              />
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isSign"
                checked={formData.isSign}
                onChange={(e) => handleInputChange('isSign', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isSign">
                是否顯示簽章欄位
              </label>
            </div>
          </div>
          <div className="card-footer">
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                預覽
              </button>
            </div>
          </div>
        </div>
      </form>

      {showModal && (
        <QuotationModal
          data={formData}
          logo={logoFile}
          isPreview={isPreview}
          onClose={() => setShowModal(false)}
        />
      )}

      {showLogoPreview && logoFile && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">LOGO 預覽</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLogoPreview(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={logoFile}
                  alt="LOGO 預覽"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogoPreview(false)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationGenerator;