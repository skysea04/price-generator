import React, { useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ServiceItem } from '../types';

interface ServiceItemFormProps {
  id: string;
  item: ServiceItem;
  onChange: (item: ServiceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  showHeaders?: boolean;
}

const ServiceItemForm: React.FC<ServiceItemFormProps> = ({ 
  id,
  item, 
  onChange, 
  onRemove, 
  canRemove,
  showHeaders = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : '',
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const amount = item.price * item.count;
    if (amount !== item.amount) {
      onChange({ ...item, amount });
    }
  }, [item.price, item.count]);

  const handleChange = (field: keyof ServiceItem, value: string | number) => {
    const updatedItem = { ...item, [field]: value };
    if (field === 'price' || field === 'count') {
      updatedItem.amount = updatedItem.price * updatedItem.count;
    }
    onChange(updatedItem);
  };

  return (
    <div>
      {showHeaders && (
        <div className="row g-2 mb-2">
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted">類別</label>
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-bold text-muted">項目</label>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted">單價</label>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted">數量</label>
          </div>
          <div className="col-md-1">
            <label className="form-label small fw-bold text-muted">單位</label>
          </div>
          <div className="col-md-1">
            <label className="form-label small fw-bold text-muted">金額</label>
          </div>
          <div className="col-md-1">
            {/* 操作欄不顯示標籤 */}
          </div>
        </div>
      )}
      
      <div className="row g-2 mb-3 align-items-center" ref={setNodeRef} style={style}>
        <div className="col-md-2">
          <div className="d-flex gap-2 align-items-center">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              style={{ cursor: 'grab', minWidth: '30px' }}
              {...attributes}
              {...listeners}
            >
              ⋮⋮
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="類別"
              value={item.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="項目"
            value={item.item}
            onChange={(e) => handleChange('item', e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="單價"
            value={item.price || ''}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="數量"
            value={item.count}
            onChange={(e) => handleChange('count', parseInt(e.target.value) || 1)}
            min="1"
          />
        </div>
        <div className="col-md-1">
          <input
            type="text"
            className="form-control"
            placeholder="單位"
            value={item.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
          />
        </div>
        <div className="col-md-1">
          <input
            type="number"
            className="form-control"
            value={item.amount}
            readOnly
          />
        </div>
        <div className="col-md-1">
          {canRemove && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={onRemove}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceItemForm;