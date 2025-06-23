
import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Changed import

interface QRCodeComponentProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  bgColor?: string;
  fgColor?: string;
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({
  value,
  size = 128,
  level = 'M',
  bgColor = '#FFFFFF',
  fgColor = '#000000',
}) => {
  if (!value) {
    return <div className="text-xs text-red-500">QR code data missing.</div>;
  }
  return (
    <QRCodeSVG // Changed component
      value={value}
      size={size}
      level={level}
      bgColor={bgColor}
      fgColor={fgColor}
      // renderAs="svg" prop is intrinsic to QRCodeSVG, no longer needed explicitly
    />
  );
};

export default QRCodeComponent;