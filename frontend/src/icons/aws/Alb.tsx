import React from 'react';

export function AwsAlbIcon(props: React.SVGProps<SVGSVGElement>) {
  const { width = 28, height = 28, fill = 'currentColor', ...rest } = props;
  return (
    <svg viewBox="0 0 64 64" width={width} height={height} {...rest}>
      <rect x="6" y="18" width="52" height="28" rx="6" ry="6" fill="none" stroke={fill} strokeWidth="3" />
      <circle cx="20" cy="32" r="5" fill={fill} />
      <circle cx="32" cy="32" r="5" fill={fill} />
      <circle cx="44" cy="32" r="5" fill={fill} />
    </svg>
  );
}

export default AwsAlbIcon;

